# Paystack Integration Guide

## Overview

This guide provides step-by-step instructions to integrate Paystack payment processing into Definition Detective.

---

## Why Paystack?

- ✅ Pre-approved account ready to use
- ✅ Popular in African markets (Nigeria, Ghana, South Africa, Kenya)
- ✅ Lower fees than international processors
- ✅ Local payment methods (Bank Transfer, USSD, Mobile Money)
- ✅ Easy integration with React/Next.js
- ✅ Excellent documentation and support

---

## Step 1: Get Your Paystack Keys

### 1.1 Login to Paystack Dashboard
1. Go to https://dashboard.paystack.com/
2. Login with your pre-approved account

### 1.2 Get API Keys
1. Go to **Settings** > **API Keys & Webhooks**
2. Copy your keys:
   - **Public Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 1.3 Add to Environment Variables

Add to `.env.local`:
```bash
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:9003
```

---

## Step 2: Install Dependencies

```bash
npm install react-paystack
```

---

## Step 3: Create Paystack Utility

Create `src/lib/paystack.ts`:

```typescript
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Paystack API client
const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Initialize transaction
export async function initializeTransaction(data: {
  email: string;
  amount: number; // in kobo (NGN) or cents
  reference?: string;
  metadata?: any;
  callback_url?: string;
}) {
  try {
    const response = await paystackClient.post('/transaction/initialize', data);
    return response.data;
  } catch (error: any) {
    console.error('Paystack initialization error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to initialize payment');
  }
}

// Verify transaction
export async function verifyTransaction(reference: string) {
  try {
    const response = await paystackClient.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to verify payment');
  }
}

// Create subscription plan
export async function createPlan(data: {
  name: string;
  amount: number; // in kobo
  interval: 'monthly' | 'annually';
  description?: string;
}) {
  try {
    const response = await paystackClient.post('/plan', data);
    return response.data;
  } catch (error: any) {
    console.error('Paystack plan creation error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to create plan');
  }
}

// Create subscription
export async function createSubscription(data: {
  customer: string; // customer code or email
  plan: string; // plan code
  authorization: string; // authorization code
}) {
  try {
    const response = await paystackClient.post('/subscription', data);
    return response.data;
  } catch (error: any) {
    console.error('Paystack subscription error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to create subscription');
  }
}

// Cancel subscription
export async function cancelSubscription(code: string, token: string) {
  try {
    const response = await paystackClient.post('/subscription/disable', {
      code,
      token,
    });
    return response.data;
  } catch (error: any) {
    console.error('Paystack cancellation error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to cancel subscription');
  }
}

// Helper: Convert amount to kobo (Paystack uses smallest currency unit)
export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

// Helper: Convert kobo to amount
export function fromKobo(kobo: number): number {
  return kobo / 100;
}

// Generate unique reference
export function generateReference(prefix: string = 'DD'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${prefix}_${timestamp}_${random}`;
}
```

---

## Step 4: Create Payment API Routes

### 4.1 Initialize Payment Route

Create `src/app/api/paystack/initialize/route.ts`:

```typescript
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
```

### 4.2 Verify Payment Route

Create `src/app/api/paystack/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, fromKobo } from '@/lib/paystack';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Verify transaction with Paystack
    const result = await verifyTransaction(reference);

    if (result.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', status: result.data.status },
        { status: 400 }
      );
    }

    const firestore = getFirestore();
    const { metadata } = result.data;
    const userId = metadata.userId;

    // Update user based on payment type
    if (metadata.type === 'subscription') {
      // Handle subscription payment
      await firestore.collection('userProfiles').doc(userId).update({
        subscriptionStatus: 'active',
        subscriptionReference: reference,
        subscriptionAmount: fromKobo(result.data.amount),
        isPremium: true,
        updatedAt: new Date(),
      });
    } else if (metadata.type === 'hint_pack') {
      // Handle hint pack purchase
      const hintsToAdd = metadata.hints || 0;
      await firestore.collection('userProfiles').doc(userId).update({
        hints: firestore.FieldValue.increment(hintsToAdd),
        updatedAt: new Date(),
      });
    }

    // Store transaction record
    await firestore.collection('transactions').add({
      userId,
      reference,
      amount: fromKobo(result.data.amount),
      type: metadata.type,
      status: 'success',
      paystackData: result.data,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: result.data,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
```

### 4.3 Webhook Handler

Create `src/app/api/paystack/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirestore } from 'firebase-admin/firestore';
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
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const firestore = getFirestore();

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata, amount, customer } = event.data;
        const userId = metadata.userId;

        if (metadata.type === 'subscription') {
          await firestore.collection('userProfiles').doc(userId).update({
            subscriptionStatus: 'active',
            subscriptionReference: reference,
            isPremium: true,
            updatedAt: new Date(),
          });
        } else if (metadata.type === 'hint_pack') {
          const hintsToAdd = metadata.hints || 0;
          await firestore.collection('userProfiles').doc(userId).update({
            hints: firestore.FieldValue.increment(hintsToAdd),
            updatedAt: new Date(),
          });
        }

        // Log transaction
        await firestore.collection('transactions').add({
          userId,
          reference,
          amount: fromKobo(amount),
          type: metadata.type,
          status: 'success',
          customerEmail: customer.email,
          createdAt: new Date(),
        });
        break;
      }

      case 'subscription.disable': {
        const { subscription_code, customer } = event.data;
        
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
        }
        break;
      }

      case 'subscription.not_renew': {
        // Handle subscription not renewing
        const { subscription_code } = event.data;
        
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
        }
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

## Step 5: Create Payment Components

### 5.1 Paystack Button Component

Create `src/components/payment/PaystackButton.tsx`:

```typescript
'use client';

import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PaystackButtonProps {
  amount: number; // in NGN
  email: string;
  type: 'subscription' | 'hint_pack';
  metadata?: any;
  onSuccess?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function PaystackButton({
  amount,
  email,
  type,
  metadata = {},
  onSuccess,
  onClose,
  children,
  className,
}: PaystackButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const config = {
    reference: `DD_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
    email,
    amount: amount * 100, // Convert to kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    metadata: {
      userId: user?.uid,
      type,
      ...metadata,
    },
  };

  const handleSuccess = async (reference: any) => {
    setLoading(true);
    try {
      // Verify payment on backend
      const token = await user?.getIdToken();
      const response = await fetch(
        `/api/paystack/verify?reference=${reference.reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        onSuccess?.();
        router.push('/payment/success');
      } else {
        router.push('/payment/failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      router.push('/payment/failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const initializePayment = usePaystackPayment(config);

  const handleClick = () => {
    if (!user) {
      router.push('/login?redirect=/subscribe');
      return;
    }

    initializePayment(handleSuccess, handleClose);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

### 5.2 Subscription Plans Component

Create `src/components/payment/SubscriptionPlans.tsx`:

```typescript
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap } from 'lucide-react';
import { PaystackButton } from './PaystackButton';
import { useAuth } from '@/hooks/use-auth';

const plans = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 2000, // NGN 2,000
    interval: 'month',
    features: [
      'Unlimited hints',
      'Ad-free experience',
      'Exclusive word packs',
      'Advanced statistics',
      'Custom badges',
    ],
    icon: Zap,
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 20000, // NGN 20,000
    interval: 'year',
    discount: 'Save 17%',
    features: [
      'Everything in Monthly',
      '17% discount',
      'Priority support',
      'Early access to features',
      'VIP badge',
    ],
    icon: Crown,
    popular: true,
  },
];

export function SubscriptionPlans() {
  const { user } = useAuth();

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <Card
            key={plan.id}
            className={plan.popular ? 'border-primary border-2 relative' : ''}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Crown className="h-4 w-4 mr-1" />
                  Best Value
                </span>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>{plan.name}</CardTitle>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardDescription>
                {plan.discount || `Billed ${plan.interval}ly`}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ₦{plan.price.toLocaleString()}
                </span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PaystackButton
                amount={plan.price}
                email={user?.email || ''}
                type="subscription"
                metadata={{
                  plan: plan.id,
                  interval: plan.interval,
                }}
                className="w-full"
              >
                Subscribe Now
              </PaystackButton>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
```

### 5.3 Hint Packs Component

Create `src/components/payment/HintPacks.tsx`:

```typescript
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardDescription } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { PaystackButton } from './PaystackButton';
import { useAuth } from '@/hooks/use-auth';

const hintPacks = [
  { hints: 5, price: 500, discount: null },
  { hints: 20, price: 1500, discount: '25% off' },
  { hints: 50, price: 3000, discount: '40% off' },
  { hints: 100, price: 5000, discount: '50% off' },
];

export function HintPacks() {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {hintPacks.map((pack) => (
        <Card key={pack.hints} className="text-center">
          <CardHeader className="pb-3">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-3xl font-bold">{pack.hints}</div>
            <CardDescription>Hints</CardDescription>
            {pack.discount && (
              <div className="text-xs text-green-600 font-medium">
                {pack.discount}
              </div>
            )}
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">₦{pack.price.toLocaleString()}</div>
          </CardContent>
          <CardFooter className="pt-0">
            <PaystackButton
              amount={pack.price}
              email={user?.email || ''}
              type="hint_pack"
              metadata={{ hints: pack.hints }}
              className="w-full"
            >
              Buy Now
            </PaystackButton>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

---

## Step 6: Update Subscribe Page

Update `src/app/subscribe/page.tsx`:

```typescript
'use client';

import { SubscriptionPlans } from '@/components/payment/SubscriptionPlans';
import { HintPacks } from '@/components/payment/HintPacks';

export default function SubscribePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
        <p className="text-xl text-muted-foreground">
          Unlock unlimited hints and remove ads
        </p>
      </div>

      <SubscriptionPlans />

      <div className="mt-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Need More Hints?</h2>
          <p className="text-muted-foreground">
            Purchase hint packs without a subscription
          </p>
        </div>
        <HintPacks />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>🔒 Secure payment processing by Paystack</p>
        <p className="mt-2">💯 Cancel anytime. No questions asked.</p>
      </div>
    </div>
  );
}
```

---

## Step 7: Create Payment Callback Pages

### Success Page

Create `src/app/payment/success/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  return (
    <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment has been processed successfully. Thank you for your purchase!
          </p>
          {reference && (
            <p className="text-sm text-muted-foreground">
              Reference: {reference}
            </p>
          )}
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href="/">Start Playing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">View Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Failed Page

Create `src/app/payment/failed/page.tsx`:

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentFailedPage() {
  return (
    <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We couldn't process your payment. Please try again or contact support if the problem persists.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href="/subscribe">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to Game</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Step 8: Set Up Webhook in Paystack Dashboard

1. Go to **Settings** > **API Keys & Webhooks**
2. Click **Add Webhook URL**
3. Enter: `https://yourdomain.com/api/paystack/webhook`
4. Save the webhook URL

---

## Testing

### Test Cards (Paystack Test Mode)

**Successful Transaction:**
- Card Number: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`
- OTP: `123456`

**Failed Transaction:**
- Card Number: `5060666666666666666`
- CVV: Any 3 digits
- Expiry: Any future date

### Testing Checklist

- [ ] Payment initialization works
- [ ] Paystack popup opens correctly
- [ ] Successful payment redirects to success page
- [ ] Failed payment redirects to failed page
- [ ] User profile updates with subscription status
- [ ] Hints are added for hint pack purchases
- [ ] Webhook receives events
- [ ] Transaction records are stored

---

## Pricing (Nigerian Naira)

### Subscriptions
- **Premium Monthly:** ₦2,000/month (~$2.50 USD)
- **Premium Yearly:** ₦20,000/year (~$25 USD, save 17%)

### Hint Packs
- **5 Hints:** ₦500 (~$0.60)
- **20 Hints:** ₦1,500 (~$1.90, 25% off)
- **50 Hints:** ₦3,000 (~$3.75, 40% off)
- **100 Hints:** ₦5,000 (~$6.25, 50% off)

*Prices can be adjusted based on your target market*

---

## Go Live Checklist

### Before Launch
- [ ] Switch to live Paystack keys
- [ ] Update webhook URL to production domain
- [ ] Test live payments with real card
- [ ] Verify webhook is receiving events
- [ ] Update pricing if needed
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add Refund Policy

### After Launch
- [ ] Monitor Paystack dashboard
- [ ] Check webhook logs
- [ ] Track conversion rates
- [ ] Gather user feedback
- [ ] Optimize pricing

---

## Support

### Paystack Resources
- **Dashboard:** https://dashboard.paystack.com/
- **Documentation:** https://paystack.com/docs
- **Support:** support@paystack.com

### Common Issues

**Issue: Payment popup doesn't open**
- Check that public key is correct
- Verify react-paystack is installed
- Check browser console for errors

**Issue: Webhook not receiving events**
- Verify webhook URL is correct
- Check webhook signature validation
- Review Paystack webhook logs

**Issue: Payment succeeds but user not updated**
- Check Firebase permissions
- Verify transaction verification logic
- Review server logs

---

**Ready to accept payments!** Follow the steps above and you'll be processing payments with Paystack in no time.
