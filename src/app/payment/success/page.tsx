'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

function PaymentSuccessContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [verifying, setVerifying] = useState(!!reference);
  const [verified, setVerified] = useState(!reference); // If no reference, assume verified
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reference) {
      verifyPaymentReference(reference);
    }
  }, [reference]);

  const verifyPaymentReference = async (ref: string) => {
    try {
      setVerifying(true);
      setError(null);

      const headers: Record<string, string> = {
        'x-user-id': user?.uid || '',
      };

      const response = await fetch(`/api/paystack/verify?reference=${ref}`, {
        headers,
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setVerified(true);
        console.log('Payment verified successfully');
      } else {
        setError('Could not verify payment. Please contact support.');
        setVerified(false);
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      setError('Error verifying payment. Please contact support.');
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {verifying ? (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            ) : verified ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <AlertCircle className="h-16 w-16 text-yellow-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verifying ? 'Verifying Payment...' : verified ? 'Payment Successful!' : 'Payment Received'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifying ? (
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          ) : verified ? (
            <p className="text-muted-foreground">
              Your payment has been processed successfully. Thank you for your purchase!
            </p>
          ) : (
            <p className="text-muted-foreground">
              Your payment has been received. If your account hasn't been updated within a few minutes, please contact support.
            </p>
          )}
          
          {error && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          )}

          {reference && (
            <p className="text-xs text-muted-foreground break-all">
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
