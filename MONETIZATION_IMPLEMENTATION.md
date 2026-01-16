# Monetization Implementation Guide

## Quick Start: Implement Monetization in 4 Steps

This guide provides step-by-step instructions to add monetization to Definition Detective.

---

## Step 1: Set Up Paystack (Payment Processing)

### 1.1 Use Your Pre-Approved Paystack Account
1. Login to https://dashboard.paystack.com/
2. You already have a pre-approved account ready to use!
3. Get your API keys from Settings > API Keys & Webhooks

### 1.2 Install Dependencies
```bash
npm install react-paystack axios
```

### 1.3 Add Environment Variables
Add to `.env.local`:
```bash
# Paystack Keys
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:9003
```

### 1.4 Pricing (Nigerian Naira)
**Subscriptions:**
- Premium Monthly: ₦2,000/month (~$2.50 USD)
- Premium Yearly: ₦20,000/year (~$25 USD)

**Hint Packs:**
- 5 Hints: ₦500
- 20 Hints: ₦1,500
- 50 Hints: ₦3,000
- 100 Hints: ₦5,000

*Prices can be adjusted for your target market*

---

## Step 2: Implement Subscription System

**Note:** For complete Paystack integration code, see `PAYSTACK_INTEGRATION.md`

### 2.1 Create Paystack Utility
Create `src/lib/stripe.ts`:
```typescript
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Create checkout session
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  mode: 'subscription' | 'payment' = 'subscription'
) {
  const session = await stripe.checkout.sessions.create({
    mode,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/subscribe`,
    client_reference_id: userId,
    metadata: {
      userId,
    },
  });

  return session;
}

// Create customer portal session
export async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/profile`,
  });

  return session;
}
```

### 2.2 Create Subscription API Routes

Create `src/app/api/stripe/checkout/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  try {
    const { priceId, mode } = await req.json();
    
    // Get user from session/token
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const session = await createCheckoutSession(userId, priceId, mode);

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

Create `src/app/api/stripe/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const firestore = getFirestore();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (userId) {
        // Update user subscription status
        await firestore.collection('userProfiles').doc(userId).update({
          subscriptionStatus: 'active',
          subscriptionId: session.subscription,
          customerId: session.customer,
          updatedAt: new Date(),
        });

        // If it's a hint purchase, add hints
        if (session.mode === 'payment') {
          const hintsToAdd = getHintsFromPrice(session.amount_total);
          await firestore.collection('userProfiles').doc(userId).update({
            hints: firestore.FieldValue.increment(hintsToAdd),
          });
        }
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      // Find user by customer ID
      const usersSnapshot = await firestore
        .collection('userProfiles')
        .where('customerId', '==', customerId)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        await userDoc.ref.update({
          subscriptionStatus: subscription.status,
          updatedAt: new Date(),
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function getHintsFromPrice(amount: number | null): number {
  if (!amount) return 0;
  const dollars = amount / 100;
  
  if (dollars === 0.99) return 5;
  if (dollars === 2.99) return 20;
  if (dollars === 5.99) return 50;
  if (dollars === 9.99) return 100;
  
  return 0;
}
```

### 2.3 Create Pricing Page

Create `src/app/subscribe/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscribePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/login?redirect=/subscribe');
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId, mode: 'subscription' }),
      });

      const { sessionId } = await response.json();
      
      const stripe = await getStripe();
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
        <p className="text-xl text-muted-foreground">
          Unlock unlimited hints and remove ads
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Monthly Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Monthly</CardTitle>
            <CardDescription>Perfect for trying it out</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$4.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Unlimited hints
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Ad-free experience
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Exclusive word packs
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Advanced statistics
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Custom badges
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!)}
              disabled={loading}
            >
              Subscribe Monthly
            </Button>
          </CardFooter>
        </Card>

        {/* Yearly Plan */}
        <Card className="border-primary border-2 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              Best Value
            </span>
          </div>
          <CardHeader>
            <CardTitle>Premium Yearly</CardTitle>
            <CardDescription>Save 33% with annual billing</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$39.99</span>
              <span className="text-muted-foreground">/year</span>
              <div className="text-sm text-green-600 mt-1">
                Save $20 compared to monthly
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Everything in Monthly
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                33% discount
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Priority support
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Early access to features
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                Exclusive content
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!)}
              disabled={loading}
            >
              Subscribe Yearly
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Cancel anytime. No questions asked.</p>
        <p className="mt-2">Secure payment processing by Stripe</p>
      </div>
    </div>
  );
}
```

---

## Step 3: Add Hint Purchase System

### 3.1 Update User Profile Type

Update `src/lib/firebase-types.ts`:
```typescript
export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  totalScore: number;
  highestLevel: number;
  rank: string;
  hints: number;
  createdAt: any;
  updatedAt: any;
  // New fields for monetization
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | null;
  subscriptionId?: string;
  customerId?: string;
  isPremium?: boolean;
}
```

### 3.2 Create Hint Purchase Component

Create `src/components/monetization/HintPurchase.tsx`:
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface HintPackage {
  hints: number;
  price: number;
  priceId: string;
  discount?: string;
}

const hintPackages: HintPackage[] = [
  { hints: 5, price: 0.99, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_HINTS_5! },
  { hints: 20, price: 2.99, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_HINTS_20!, discount: '25%' },
  { hints: 50, price: 5.99, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_HINTS_50!, discount: '40%' },
  { hints: 100, price: 9.99, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_HINTS_100!, discount: '50%' },
];

export function HintPurchase() {
  const handlePurchase = async (priceId: string) => {
    // Similar to subscription flow
    // Redirect to Stripe Checkout
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {hintPackages.map((pkg) => (
        <Card key={pkg.hints} className="p-4 text-center">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
          <div className="text-2xl font-bold">{pkg.hints}</div>
          <div className="text-sm text-muted-foreground mb-2">Hints</div>
          {pkg.discount && (
            <div className="text-xs text-green-600 mb-2">
              Save {pkg.discount}
            </div>
          )}
          <div className="text-lg font-semibold mb-3">
            ${pkg.price.toFixed(2)}
          </div>
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => handlePurchase(pkg.priceId)}
          >
            Buy Now
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

---

## Step 4: Implement Ad System

### 4.1 Set Up Google AdSense

1. Apply for AdSense at https://www.google.com/adsense/
2. Add your site
3. Wait for approval (1-2 weeks)
4. Get your Publisher ID

### 4.2 Add AdSense Script

Update `src/app/layout.tsx`:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 4.3 Create Ad Components

Create `src/components/ads/BannerAd.tsx`:
```typescript
'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';

export function BannerAd() {
  const { user } = useUser();
  const userProfile = null; // Get from Firestore

  // Don't show ads to premium users
  if (userProfile?.isPremium) {
    return null;
  }

  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error('Ad error:', err);
    }
  }, []);

  return (
    <div className="my-4">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

Create `src/components/ads/RewardedAd.tsx`:
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Clapperboard } from 'lucide-react';

export function RewardedAdButton({ onReward }: { onReward: () => void }) {
  const handleWatchAd = () => {
    // In production, integrate with AdMob Rewarded Ads
    // For now, simulate watching an ad
    setTimeout(() => {
      onReward();
    }, 3000);
  };

  return (
    <Button onClick={handleWatchAd} variant="outline">
      <Clapperboard className="mr-2 h-4 w-4" />
      Watch Ad for Free Hint
    </Button>
  );
}
```

---

## Step 5: Update Game Logic

### 5.1 Check Premium Status

Update `src/app/page.tsx` to check premium status:
```typescript
const { user } = useAuth();
const { data: userProfile } = useDoc<UserProfile>(
  user ? doc(firestore, 'userProfiles', user.uid) : null
);

const isPremium = userProfile?.isPremium || userProfile?.subscriptionStatus === 'active';

// Show ads only to non-premium users
{!isPremium && <BannerAd />}

// Unlimited hints for premium users
const canUseHint = isPremium || (userProfile?.hints ?? 0) > 0;
```

---

## Testing Checklist

### Stripe Integration
- [ ] Checkout session creates successfully
- [ ] Payment completes and redirects to success page
- [ ] Webhook receives events
- [ ] User profile updates with subscription status
- [ ] Hints are added for one-time purchases
- [ ] Subscription cancellation works
- [ ] Customer portal accessible

### Ad Integration
- [ ] Ads display for free users
- [ ] Ads hidden for premium users
- [ ] Rewarded ads grant hints
- [ ] Ad frequency is reasonable
- [ ] Ads don't break layout

### User Experience
- [ ] Pricing page is clear
- [ ] Purchase flow is smooth
- [ ] Error messages are helpful
- [ ] Premium features are locked for free users
- [ ] Premium badge shows for subscribers

---

## Go Live Checklist

### Before Launch
- [ ] Switch Stripe to live mode
- [ ] Update Stripe keys in production
- [ ] Set up Stripe webhook in production
- [ ] Test live payments with real card
- [ ] Set up AdSense for production domain
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add Refund Policy
- [ ] Set up customer support email
- [ ] Configure tax settings in Stripe

### After Launch
- [ ] Monitor Stripe dashboard
- [ ] Check webhook logs
- [ ] Monitor ad performance
- [ ] Track conversion rates
- [ ] Gather user feedback
- [ ] A/B test pricing
- [ ] Optimize ad placements

---

## Support Resources

### Stripe
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

### AdSense
- [AdSense Dashboard](https://www.google.com/adsense/)
- [AdSense Help](https://support.google.com/adsense/)

### Firebase
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

---

**Ready to implement?** Start with Step 1 and work your way through. Each step builds on the previous one.

**Questions?** Check the main MONETIZATION_STRATEGY.md for detailed business planning.
