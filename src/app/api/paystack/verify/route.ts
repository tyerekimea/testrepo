import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    // Get user ID from header (set by client)
    const userId = req.headers.get('x-user-id');

    // Add retry logic for Paystack verification
    let result;
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        result = await verifyTransaction(reference);
        break;
      } catch (error: any) {
        lastError = error;
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to verify transaction after retries');
    }

    if (result.data.status !== 'success') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verification failed', 
          status: result.data.status,
          data: result.data
        },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    const { metadata } = result.data;
    const paymentUserId = metadata?.userId;

    // Validate metadata
    if (!paymentUserId) {
      console.error('Missing userId in metadata:', metadata);
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // If user ID header is provided, verify it matches
    if (userId && userId !== paymentUserId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const amount = fromKobo(result.data.amount);
    const paymentType = metadata.type;

    if (!paymentType) {
      return NextResponse.json(
        { error: 'Unknown payment type' },
        { status: 400 }
      );
    }

    // Update user based on payment type
    if (paymentType === 'subscription') {
      await firestore.collection('userProfiles').doc(paymentUserId).update({
        subscriptionStatus: 'active',
        subscriptionReference: reference,
        subscriptionAmount: amount,
        isPremium: true,
        updatedAt: new Date(),
      });
    } else if (paymentType === 'hint_pack') {
      const hintsToAdd = metadata.hints || 0;
      await firestore.collection('userProfiles').doc(paymentUserId).update({
        hints: FieldValue.increment(hintsToAdd),
        hintsLastUpdated: new Date(),
        updatedAt: new Date(),
      });
    } else {
      return NextResponse.json(
        { error: 'Unknown payment type: ' + paymentType },
        { status: 400 }
      );
    }

    // Store transaction record
    await firestore.collection('transactions').add({
      userId: paymentUserId,
      reference,
      amount,
      type: paymentType,
      status: 'success',
      verifiedAt: new Date(),
      verifiedBy: 'api',
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        reference,
        amount,
        type: paymentType,
        status: result.data.status,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to verify payment',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

  try {
    // Verify authentication token - try to get from Authorization header
    const authHeader = req.headers.get('authorization');
    const userId = req.headers.get('x-user-id');
    
    // If both auth header and user ID are missing, this is an unauthenticated request
    // We'll still process it but won't update the database
    let decodedUserId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Try to verify token using Firebase Admin SDK
        const { getAuth } = require('firebase-admin/auth');
        const decodedToken = await getAuth().verifyIdToken(token);
        decodedUserId = decodedToken.uid;
      } catch (error: any) {
        console.error('Token verification failed:', error.message);
        // If token verification fails, check if we have x-user-id header as fallback
        if (!userId) {
          return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
        }
      }
    } else if (userId) {
      decodedUserId = userId;
    }

    // Add retry logic for Paystack verification (payment might be processing)
    let result;
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        result = await verifyTransaction(reference);
        break;
      } catch (error: any) {
        lastError = error;
        retries++;
        if (retries < maxRetries) {
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to verify transaction after retries');
    }

    if (result.data.status !== 'success') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verification failed', 
          status: result.data.status,
          data: result.data
        },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    const { metadata } = result.data;
    const paymentUserId = metadata?.userId;

    // Validate metadata
    if (!paymentUserId) {
      console.error('Missing userId in metadata:', metadata);
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // If we have a decoded user ID, verify it matches the payment
    if (decodedUserId && decodedUserId !== paymentUserId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const amount = fromKobo(result.data.amount);
    const paymentType = metadata.type;

    if (!paymentType) {
      return NextResponse.json(
        { error: 'Unknown payment type' },
        { status: 400 }
      );
    }

    // Update user based on payment type
    if (paymentType === 'subscription') {
      // Handle subscription payment
      await firestore.collection('userProfiles').doc(paymentUserId).update({
        subscriptionStatus: 'active',
        subscriptionReference: reference,
        subscriptionAmount: amount,
        isPremium: true,
        updatedAt: new Date(),
      });
    } else if (paymentType === 'hint_pack') {
      // Handle hint pack purchase
      const hintsToAdd = metadata.hints || 0;
      await firestore.collection('userProfiles').doc(paymentUserId).update({
        hints: FieldValue.increment(hintsToAdd),
        hintsLastUpdated: new Date(),
        updatedAt: new Date(),
      });
    } else {
      return NextResponse.json(
        { error: 'Unknown payment type: ' + paymentType },
        { status: 400 }
      );
    }

    // Store transaction record
    await firestore.collection('transactions').add({
      userId: paymentUserId,
      reference,
      amount,
      type: paymentType,
      status: 'success',
      verifiedAt: new Date(),
      verifiedBy: 'api',
      paystackData: result.data,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        reference,
        amount,
        type: paymentType,
        status: result.data.status,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to verify payment',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

    // Add retry logic for Paystack verification (payment might be processing)
    let result;
    let retries = 0;
    const maxRetries = 3;
    let lastError;

    while (retries < maxRetries) {
      try {
        result = await verifyTransaction(reference);
        break;
      } catch (error: any) {
        lastError = error;
        retries++;
        if (retries < maxRetries) {
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to verify transaction after retries');
    }

    if (result.data.status !== 'success') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verification failed', 
          status: result.data.status,
          data: result.data
        },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    const { metadata } = result.data;
    const userId = metadata?.userId;

    // Validate metadata
    if (!userId) {
      console.error('Missing userId in metadata:', metadata);
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // Verify the user ID matches the token
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const amount = fromKobo(result.data.amount);
    const paymentType = metadata.type;

    try {
      // Update user based on payment type
      if (paymentType === 'subscription') {
        // Handle subscription payment
        await firestore.collection('userProfiles').doc(userId).update({
          subscriptionStatus: 'active',
          subscriptionReference: reference,
          subscriptionAmount: amount,
          isPremium: true,
          updatedAt: new Date(),
        });
      } else if (paymentType === 'hint_pack') {
        // Handle hint pack purchase
        const hintsToAdd = metadata.hints || 0;
        await firestore.collection('userProfiles').doc(userId).update({
          hints: FieldValue.increment(hintsToAdd),
          hintsLastUpdated: new Date(),
          updatedAt: new Date(),
        });
      } else {
        return NextResponse.json(
          { error: 'Unknown payment type: ' + paymentType },
          { status: 400 }
        );
      }

      // Store transaction record
      await firestore.collection('transactions').add({
        userId,
        reference,
        amount,
        type: paymentType,
        status: 'success',
        verifiedAt: new Date(),
        paystackData: result.data,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference,
          amount,
          type: paymentType,
          status: result.data.status,
        },
      });
    } catch (dbError: any) {
      console.error('Database error while processing payment:', dbError);
      return NextResponse.json(
        { 
          error: 'Payment verified but failed to update profile. Contact support.',
          reference,
          details: dbError.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to verify payment',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
