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
