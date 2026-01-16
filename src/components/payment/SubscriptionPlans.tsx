'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap, AlertCircle } from 'lucide-react';
import { PaystackButton } from './PaystackButton';
import { useAuth } from '@/hooks/use-auth';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/firebase-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const plans = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 2000, // NGN 2,000
    interval: 'month',
    features: [
      'Unlimited hints',
      'Ad-free experience',
      '🔬 Science Safari theme',
      '🏛️ History Quest theme',
      '🌍 Geo Genius theme',
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
      'All premium word themes',
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
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'userProfiles', user.uid) : null
  , [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Check if user has active subscription
  const hasActiveSubscription = userProfile?.isPremium && 
    userProfile?.subscriptionStatus === 'active';
  
  const currentPlan = userProfile?.subscriptionPlan;

  return (
    <div className="space-y-6">
      {/* Show alert if user already has active subscription */}
      {hasActiveSubscription && (
        <Alert className="max-w-4xl mx-auto">
          <Crown className="h-4 w-4" />
          <AlertTitle>You're already a Premium member!</AlertTitle>
          <AlertDescription>
            You currently have an active {currentPlan} subscription. 
            {currentPlan === 'monthly' && ' You can upgrade to yearly to save 17%.'}
            {' '}
            <Link href="/profile" className="underline font-medium">
              View your subscription details
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const canSubscribe = !hasActiveSubscription || 
            (currentPlan === 'monthly' && plan.id === 'yearly');
          
          return (
            <Card
              key={plan.id}
              className={`${isCurrentPlan || plan.popular ? 'border-primary border-2' : ''} ${plan.popular ? 'relative' : ''}`}
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
            <CardFooter className="flex flex-col gap-2">
              {isCurrentPlan ? (
                <Button className="w-full" variant="outline" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  Current Plan
                </Button>
              ) : !canSubscribe ? (
                <Button className="w-full" variant="outline" disabled>
                  Already Subscribed
                </Button>
              ) : currentPlan === 'monthly' && plan.id === 'yearly' ? (
                <PaystackButton
                  amount={plan.price}
                  email={user?.email || ''}
                  type="subscription"
                  metadata={{
                    plan: plan.id,
                    interval: plan.interval,
                    upgrade: true,
                  }}
                  className="w-full"
                >
                  Upgrade to Yearly
                </PaystackButton>
              ) : (
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
              )}
              {isCurrentPlan && (
                <p className="text-xs text-center text-muted-foreground">
                  Manage your subscription in your profile
                </p>
              )}
            </CardFooter>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
