import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fromKobo } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const firestore = getFirestore();

    // Log webhook event for debugging
    console.log('Paystack webhook event:', event.event, event.data?.reference || '');

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata, amount, customer } = event.data;
        const userId = metadata?.userId;

        if (!userId) {
          console.error('Missing userId in webhook metadata:', metadata);
          return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
        }

        const paymentType = metadata.type;

        try {
          if (paymentType === 'subscription') {
            await firestore.collection('userProfiles').doc(userId).update({
              subscriptionStatus: 'active',
              subscriptionReference: reference,
              isPremium: true,
              subscriptionAmount: fromKobo(amount),
              updatedAt: new Date(),
            });
          } else if (paymentType === 'hint_pack') {
            const hintsToAdd = metadata.hints || 0;
            await firestore.collection('userProfiles').doc(userId).update({
              hints: FieldValue.increment(hintsToAdd),
              hintsLastUpdated: new Date(),
              updatedAt: new Date(),
            });
          } else {
            console.warn('Unknown payment type in webhook:', paymentType);
          }

          // Log transaction
          await firestore.collection('transactions').add({
            userId,
            reference,
            amount: fromKobo(amount),
            type: paymentType,
            status: 'success',
            source: 'webhook',
            customerEmail: customer?.email,
            paystackData: event.data,
            createdAt: new Date(),
          });

          console.log(`Payment webhook processed successfully for ${userId}`);
        } catch (dbError: any) {
          console.error('Database error in webhook processing:', dbError);
          // Store failed webhook event for retry
          await firestore.collection('failedWebhooks').add({
            reference,
            event: event.event,
            data: event.data,
            error: dbError.message,
            createdAt: new Date(),
            retryCount: 0,
          });
          throw dbError;
        }
        break;
      }

      case 'subscription.disable': {
        const { subscription_code, customer } = event.data;
        
        try {
          // Find user by subscription code
          const usersSnapshot = await firestore
            .collection('userProfiles')
            .where('subscriptionReference', '==', subscription_code)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: 'canceled',
              isPremium: false,
              updatedAt: new Date(),
            });
            console.log('Subscription disabled for user:', userDoc.id);
          } else {
            console.warn('User not found for subscription:', subscription_code);
          }
        } catch (error: any) {
          console.error('Error processing subscription.disable:', error);
          throw error;
        }
        break;
      }

      case 'subscription.not_renew': {
        // Handle subscription not renewing
        const { subscription_code } = event.data;
        
        try {
          const usersSnapshot = await firestore
            .collection('userProfiles')
            .where('subscriptionReference', '==', subscription_code)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: 'expiring',
              updatedAt: new Date(),
            });
            console.log('Subscription marked as expiring:', userDoc.id);
          }
        } catch (error: any) {
          console.error('Error processing subscription.not_renew:', error);
          throw error;
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    // Return 200 to acknowledge webhook even if there's an error
    // Paystack will retry failed webhooks
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 200 }
    );
  }
}
