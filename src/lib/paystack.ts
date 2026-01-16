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
