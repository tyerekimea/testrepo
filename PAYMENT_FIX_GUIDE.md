# Payment Issue Fix - Comprehensive Guide

## Problem Summary
Payment was successful on Paystack but failing to be confirmed in the app, leaving users in limbo and thinking their payment failed.

## Root Causes Fixed

### 1. **Missing Authentication in Verification Endpoint**
- **Issue**: The `/api/paystack/verify` endpoint didn't verify the auth token, allowing potential unauthorized access
- **Fix**: Added Firebase token verification to ensure only authenticated users can verify their payments

### 2. **Race Condition in Payment Verification**
- **Issue**: App tried to verify payment immediately after Paystack success, but Paystack's system might still be processing
- **Fix**: Implemented retry logic with exponential backoff (3 attempts with 1-3 second delays)

### 3. **Poor Error Handling**
- **Issue**: Generic error messages without retry capability
- **Fix**: 
  - Added detailed error messages to user
  - Implemented retry mechanism in PaystackButton component
  - Added toast notifications for better UX
  - Added error display in UI with AlertCircle icon

### 4. **No Fallback Verification**
- **Issue**: If verification failed initially, no way to verify later
- **Fix**: 
  - Success page now calls `/api/paystack/verify` again as fallback
  - Shows verification status (Verifying → Verified or Error)
  - Allows users to check their profile for payment status

### 5. **Webhook Processing Didn't Capture Failures**
- **Issue**: Failed webhook updates weren't tracked for retry
- **Fix**:
  - Webhook now stores failed events in `failedWebhooks` collection
  - Created `/api/paystack/retry-webhooks` endpoint to retry failed updates
  - Added better error logging throughout the webhook

## Files Modified

### 1. [src/app/api/paystack/verify/route.ts](src/app/api/paystack/verify/route.ts)
**Changes:**
- Added Firebase authentication token verification
- Implemented retry logic for Paystack API calls (3 attempts)
- Added metadata validation
- User ID matching verification (security)
- Better error messages and logging
- Separate try-catch for database operations

### 2. [src/components/payment/PaystackButton.tsx](src/components/payment/PaystackButton.tsx)
**Changes:**
- Added `verifyPaymentWithRetry()` function with exponential backoff
- Added error state and display with AlertCircle
- Added toast notifications for success/error
- Better user feedback (Processing, Loading states)
- Enhanced error messages
- `use-toast` hook for notifications

### 3. [src/app/api/paystack/webhook/route.ts](src/app/api/paystack/webhook/route.ts)
**Changes:**
- Added detailed logging for debugging
- Metadata validation with proper error handling
- Store failed webhooks in `failedWebhooks` collection
- Separate try-catch for database operations
- Return 200 status even on error (Paystack will retry)
- Better error messages

### 4. [src/app/payment/success/page.tsx](src/app/payment/success/page.tsx)
**New:**
- Added verification on page load
- Shows "Verifying Payment..." state
- Fallback verification if initial verification failed
- Reference number display for support
- Better loading state with spinner

### 5. [src/app/api/paystack/retry-webhooks/route.ts](src/app/api/paystack/retry-webhooks/route.ts)
**New:**
- Manual webhook retry endpoint
- Processes failed webhooks with retry limit (5 max retries)
- Increments retry count on failure
- Can be called via cron job or manual trigger

## Setup Required

### Environment Variables
Make sure these are set in `.env.local`:
```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
WEBHOOK_RETRY_SECRET=your_secure_random_string_here
```

### Database Collections
The following Firestore collections are used:
- `userProfiles` - User profile data
- `transactions` - Payment transaction records
- `failedWebhooks` - Failed webhook events for retry

### Cron Job Setup (Optional but Recommended)
To automatically retry failed webhooks, set up a cron job to call:
```
POST /api/paystack/retry-webhooks
Header: Authorization: Bearer {WEBHOOK_RETRY_SECRET}
```

Example with cron-job.org or Google Cloud Scheduler:
```
https://yourdomain.com/api/paystack/retry-webhooks
Method: POST
Header: Authorization: Bearer your_webhook_retry_secret
Schedule: Every 5 minutes (or as needed)
```

## Testing the Fix

### 1. **Test Successful Payment Flow**
```bash
1. Go to /subscribe page
2. Click payment button
3. Use Paystack test card: 4084084084084081
4. Enter any future date and any 3-digit CVC
5. Should see "Processing..." then redirect to /payment/success
6. Success page should verify payment automatically
```

### 2. **Test Error Handling**
```bash
1. Go to /subscribe page
2. Click payment button but close the modal (triggers onClose)
3. Should handle gracefully
4. Should show error message in UI
```

### 3. **Test Webhook Retry**
```bash
1. Manually stop the database connection while payment processes
2. Webhook will fail and be stored in failedWebhooks
3. Call retry endpoint manually
4. Payment should be processed on retry
```

## Monitoring & Debugging

### Check Webhook Logs
```javascript
// In Firebase Console, search for logs in Functions or Cloud Logging
// Look for: "Paystack webhook event:"
```

### Check Failed Webhooks
```javascript
// In Firestore Console
// Go to Collection: failedWebhooks
// Check documents for retry status
```

### View Transactions
```javascript
// In Firestore Console
// Go to Collection: transactions
// Filter by source: "webhook" or "webhook_retry" to see retry results
```

## Troubleshooting

### Payment shows success on Paystack but app says failed

**Check these in order:**

1. **Verify endpoint accessibility**
   ```bash
   curl -X GET "https://yourdomain.com/api/paystack/verify?reference=TEST_REF" \
     -H "Authorization: Bearer your_token"
   ```

2. **Check Firestore connection**
   - Verify Firebase admin credentials are loaded
   - Check Cloud Logging for errors

3. **Check webhook configuration**
   - Go to Paystack dashboard
   - Settings → Webhooks
   - Verify webhook URL: `https://yourdomain.com/api/paystack/webhook`
   - Check "Enable Test Events" and send test webhook

4. **Manually retry failed webhooks**
   ```bash
   curl -X POST "https://yourdomain.com/api/paystack/retry-webhooks" \
     -H "Authorization: Bearer your_webhook_retry_secret"
   ```

### Users report payment processed but profile not updated

1. **Check transaction record**
   - Go to Firestore → transactions collection
   - Search for reference number from success page

2. **Check user profile**
   - Go to Firestore → userProfiles
   - Verify `isPremium` and `subscriptionStatus` fields

3. **Manually retry webhook**
   - Use retry endpoint above
   - Or re-call verify endpoint with reference

### Payment verification times out

This might happen if:
- Paystack API is slow
- Network latency is high

**Fix**: Retry logic is now built-in (3 attempts), so user should see "Processing..." and then succeed. If not, they can try again.

## Success Indicators

After applying these fixes, you should see:

✅ Users successfully verify payments immediately after Paystack success
✅ Error messages are clear and actionable
✅ Failed webhooks are captured and can be retried
✅ Failed webhooks are retried automatically (if cron job configured)
✅ Users can manually verify payment on success page
✅ All payments are tracked in transactions collection
✅ Payment reference is saved for support purposes

## Performance Impact

- Minimal: Retry logic adds ~1-3 seconds to verification time
- Webhook processing slightly improved with better error handling
- Database operations are isolated in try-catch blocks

## Security Notes

- Auth token verification on `/api/paystack/verify` prevents unauthorized access
- User ID validation ensures users can only verify their own payments
- Webhook signature verification prevents spoofed webhook calls
- Webhook retry endpoint requires secret key

## Next Steps

1. Deploy these changes
2. Monitor Firestore failedWebhooks collection
3. Set up cron job for webhook retries (optional)
4. Test full payment flow with real Paystack account
5. Monitor transaction collection for payment records
6. Add analytics to track payment success/failure rates
