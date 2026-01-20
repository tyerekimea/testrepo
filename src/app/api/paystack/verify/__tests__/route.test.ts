/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the paystack module
jest.mock('@/lib/paystack', () => ({
  verifyTransaction: jest.fn(),
  fromKobo: jest.fn((kobo: number) => kobo / 100),
}));

// Mock firebase-admin/firestore
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn().mockResolvedValue({}),
      })),
      add: jest.fn().mockResolvedValue({ id: 'test-transaction-id' }),
    })),
  })),
  FieldValue: {
    increment: jest.fn((value: number) => ({ _increment: value })),
  },
}));

import { verifyTransaction } from '@/lib/paystack';

const mockVerifyTransaction = verifyTransaction as jest.MockedFunction<typeof verifyTransaction>;

describe('Paystack Verify API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if reference is missing', async () => {
    const req = new NextRequest('http://localhost/api/paystack/verify');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Reference is required');
  });

  it('should return 400 if payment verification fails', async () => {
    mockVerifyTransaction.mockResolvedValue({
      data: {
        status: 'failed',
        amount: 100000,
        metadata: { userId: 'user123', type: 'subscription' },
      },
    } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Payment verification failed');
  });

  it('should return 400 if userId is missing in metadata', async () => {
    mockVerifyTransaction.mockResolvedValue({
      data: {
        status: 'success',
        amount: 100000,
        metadata: { type: 'subscription' },
      },
    } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid payment metadata');
  });

  it('should return 403 if user ID header does not match payment userId', async () => {
    mockVerifyTransaction.mockResolvedValue({
      data: {
        status: 'success',
        amount: 100000,
        metadata: { userId: 'user123', type: 'subscription' },
      },
    } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref', {
      headers: { 'x-user-id': 'different-user' },
    });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('User ID mismatch');
  });

  it('should return 400 if payment type is missing', async () => {
    mockVerifyTransaction.mockResolvedValue({
      data: {
        status: 'success',
        amount: 100000,
        metadata: { userId: 'user123' },
      },
    } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Unknown payment type');
  });

  it('should return 400 for unknown payment type', async () => {
    mockVerifyTransaction.mockResolvedValue({
      data: {
        status: 'success',
        amount: 100000,
        metadata: { userId: 'user123', type: 'unknown_type' },
      },
    } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Unknown payment type: unknown_type');
  });

  it('should successfully verify subscription payment', async () => {
    mockVerifyTransaction.mockResolvedValue({
      data: {
        status: 'success',
        amount: 100000,
        metadata: { userId: 'user123', type: 'subscription' },
      },
    } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Payment verified successfully');
    expect(data.data.type).toBe('subscription');
    expect(data.data.amount).toBe(1000);
  });

  it('should successfully verify hint pack payment', async () => {
    mockVerifyTransaction.mockResolvedValue({
      data: {
        status: 'success',
        amount: 50000,
        metadata: { userId: 'user123', type: 'hint_pack', hints: 10 },
      },
    } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.type).toBe('hint_pack');
    expect(data.data.amount).toBe(500);
  });

  it('should retry verification on failure', async () => {
    mockVerifyTransaction
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        data: {
          status: 'success',
          amount: 100000,
          metadata: { userId: 'user123', type: 'subscription' },
        },
      } as any);

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockVerifyTransaction).toHaveBeenCalledTimes(3);
  });

  it('should return 500 after max retries exceeded', async () => {
    mockVerifyTransaction.mockRejectedValue(new Error('Network error'));

    const req = new NextRequest('http://localhost/api/paystack/verify?reference=test-ref');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Network error');
    expect(mockVerifyTransaction).toHaveBeenCalledTimes(3);
  });
});
