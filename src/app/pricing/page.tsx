'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Star, Crown } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-headline">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock unlimited hints, remove ads, and get exclusive features
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
        {/* Free Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Free</CardTitle>
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Perfect for casual players</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Unlimited gameplay</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>5 free hints per day</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Access to leaderboards</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Basic statistics</span>
              </li>
              <li className="flex items-start text-muted-foreground">
                <span className="mr-2">•</span>
                <span>Ads supported</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Play Free</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Monthly */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Premium</CardTitle>
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Most popular choice</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">₦2,000</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Everything in Free, plus:</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Unlimited hints</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Exclusive word packs</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Advanced statistics</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Custom profile badges</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/subscribe">Get Premium</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Yearly */}
        <Card className="flex flex-col border-primary border-2 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center">
              <Crown className="h-4 w-4 mr-1" />
              Best Value
            </span>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Premium Yearly</CardTitle>
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Save 33% annually</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">₦20,000</span>
              <span className="text-muted-foreground">/year</span>
              <div className="text-sm text-green-600 mt-1 font-medium">
                Save ₦4,000 vs monthly
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Everything in Premium, plus:</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>33% discount</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Early access to features</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Exclusive content</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>VIP badge</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/subscribe">Get Yearly</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Hint Packs Section */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Need More Hints?</h2>
          <p className="text-muted-foreground">Purchase hint packs without a subscription</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { hints: 5, price: 500, discount: null },
            { hints: 20, price: 1500, discount: '25% off' },
            { hints: 50, price: 3000, discount: '40% off' },
            { hints: 100, price: 5000, discount: '50% off' },
          ].map((pack) => (
            <Card key={pack.hints} className="text-center">
              <CardHeader className="pb-3">
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
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href="/subscribe">Buy Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Can I cancel anytime?</h3>
            <p className="text-muted-foreground">
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit/debit cards, bank transfers, USSD, and mobile money through our secure payment processor, Paystack.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Do hint packs expire?</h3>
            <p className="text-muted-foreground">
              No, purchased hints never expire. They'll remain in your account until you use them.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Can I upgrade from monthly to yearly?</h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade at any time. We'll prorate your existing subscription and apply it to the yearly plan.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">
              The free plan lets you play unlimited games with 5 hints per day. This is essentially a permanent trial of the core game!
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">What happens if I cancel?</h3>
            <p className="text-muted-foreground">
              You'll revert to the free plan. Your progress and statistics are saved, but you'll lose access to premium features like unlimited hints and ad-free gameplay.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>🔒 Secure payment processing by Paystack</p>
        <p className="mt-2">💯 30-day money-back guarantee</p>
        <p className="mt-2">📧 Email support: support@definitiondetective.com</p>
      </div>
    </div>
  );
}
