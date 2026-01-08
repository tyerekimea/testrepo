'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

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
  const [PaystackHook, setPaystackHook] = useState<any>(null);

  // Load Paystack hook only on client side
  useEffect(() => {
    import('react-paystack').then((module) => {
      setPaystackHook(() => module.usePaystackPayment);
    });
  }, []);

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

  const initializePayment = PaystackHook ? PaystackHook(config) : null;

  const handleClick = () => {
    if (!user) {
      router.push('/login?redirect=/subscribe');
      return;
    }

    if (!initializePayment) {
      console.error('Paystack not loaded yet');
      return;
    }

    initializePayment({
      onSuccess: handleSuccess,
      onClose: handleClose,
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || !PaystackHook}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : !PaystackHook ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
