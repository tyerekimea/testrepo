import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fromKobo } from '@/lib/paystack';

/**
 * This endpoint retries failed webhook events
 * Should be called periodically via a cron job or manually when needed
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authorization header (should be from internal service or cron)
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.WEBHOOK_RETRY_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const firestore = getFirestore();

    // Get failed webhooks that haven't been retried too many times
    const failedWebhooks = await firestore
      .collection('failedWebhooks')
      .where('retryCount', '<', 5)
      .orderBy('retryCount', 'asc')
      .orderBy('createdAt', 'asc')
      .limit(10)
      .get();

    if (failedWebhooks.empty) {
      return NextResponse.json({
        success: true,
        message: 'No failed webhooks to retry',
        retryCount: 0,
      });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const doc of failedWebhooks.docs) {
      const webhookData = doc.data();
      const { reference, data, event } = webhookData;

      try {
        const { metadata, amount } = data;
        const userId = metadata?.userId;

        if (!userId) {
          throw new Error('Missing userId in metadata');
        }

        const paymentType = metadata.type;

        // Process the webhook
        if (event === 'charge.success') {
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
          }

          // Log transaction
          await firestore.collection('transactions').add({
            userId,
            reference,
            amount: fromKobo(amount),
            type: paymentType,
            status: 'success',
            source: 'webhook_retry',
            customerEmail: data.customer?.email,
            createdAt: new Date(),
          });

          // Remove from failed webhooks
          await doc.ref.delete();
          console.log(`Successfully retried webhook: ${reference}`);
          successCount++;
        }
      } catch (error: any) {
        console.error(`Failed to retry webhook ${reference}:`, error);
        // Increment retry count
        await doc.ref.update({
          retryCount: FieldValue.increment(1),
          lastRetryError: error.message,
          lastRetryAt: new Date(),
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Webhook retry completed`,
      successCount,
      failureCount,
      totalProcessed: failedWebhooks.size,
    });
  } catch (error: any) {
    console.error('Webhook retry error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook retry failed' },
      { status: 500 }
    );
  }
}
