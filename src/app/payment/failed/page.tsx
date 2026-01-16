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
