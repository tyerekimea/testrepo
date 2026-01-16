import { NextRequest, NextResponse } from 'next/server';
import { initializeTransaction, generateReference, toKobo } from '@/lib/paystack';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  try {
    const { amount, email, type, metadata } = await req.json();
    
    // Get user from token
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Generate unique reference
    const reference = generateReference('DD');

    // Initialize transaction
    const result = await initializeTransaction({
      email,
      amount: toKobo(amount), // Convert to kobo
      reference,
      metadata: {
        userId,
        type, // 'subscription' or 'hint_pack'
        ...metadata,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
    });

    return NextResponse.json({
      success: true,
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
