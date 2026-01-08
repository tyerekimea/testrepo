'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Load payment components only on client side to avoid SSR issues
const SubscriptionPlans = dynamic(
  () => import('@/components/payment/SubscriptionPlans').then(mod => ({ default: mod.SubscriptionPlans })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    ssr: false,
  }
);

const HintPacks = dynamic(
  () => import('@/components/payment/HintPacks').then(mod => ({ default: mod.HintPacks })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    ssr: false,
  }
);

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
