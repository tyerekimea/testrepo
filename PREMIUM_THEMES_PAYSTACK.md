# Premium Word Themes - Paystack Integration

## Overview

Word themes are now integrated with the Paystack subscription system. Users who want to access premium themes (Science Safari, History Quest, Geo Genius) are directed to the subscription page where they can purchase a premium plan.

## User Flow

### Free User Experience

1. **User sees theme selector** on game page
2. **Clicks on premium theme** (e.g., Science Safari)
3. **Upgrade dialog appears** showing:
   - Premium theme descriptions
   - Premium benefits
   - "View Premium Plans" button
4. **Clicks "View Premium Plans"**
5. **Redirected to `/subscribe` page**
6. **Sees subscription plans** with Paystack payment
7. **Completes payment** via Paystack
8. **Becomes premium user**
9. **Can now select all themes**

### Premium User Experience

1. **User sees theme selector** on game page
2. **Can select any theme** (no locks)
3. **Theme changes immediately**
4. **Game restarts with new theme**
5. **Words match selected theme**

## Integration Points

### 1. Theme Selector Component

**File:** `src/components/theme-selector.tsx`

**Features:**
- Shows all 4 themes
- Lock icon on premium themes for free users
- Upgrade dialog with theme benefits
- "View Premium Plans" button

**Upgrade Dialog Content:**
```
🎓 Premium Word Themes

Premium Themes Include:
🔬 Science Safari
   Biological sciences, space, and ecosystems

🏛️ History Quest
   Ancient civilizations, historical figures, and artifacts

🌍 Geo Genius
   Countries, capitals, and landmarks

✨ Premium Benefits:
• All themed word generation
• Unlimited hints
• Ad-free experience
• Advanced statistics
```

### 2. Subscribe Page

**File:** `src/app/subscribe/page.tsx`

**Features:**
- Displays subscription plans
- Highlights word themes
- Shows theme icons (🔬 🏛️ 🌍)
- Paystack payment integration

**Page Header:**
```
Upgrade to Premium
Unlock themed word generation, unlimited hints, and ad-free experience

🔬 Science Safari  🏛️ History Quest  🌍 Geo Genius
```

### 3. Subscription Plans

**File:** `src/components/payment/SubscriptionPlans.tsx`

**Monthly Plan Features:**
- Unlimited hints
- Ad-free experience
- 🔬 Science Safari theme
- 🏛️ History Quest theme
- 🌍 Geo Genius theme
- Advanced statistics
- Custom badges

**Yearly Plan Features:**
- Everything in Monthly
- 17% discount
- All premium word themes
- Priority support
- Early access to features
- VIP badge

### 4. Main Game Page

**File:** `src/app/page.tsx`

**Integration:**
```typescript
<ThemeSelector
  selectedTheme={selectedTheme}
  onThemeChange={async (theme) => {
    setSelectedTheme(theme);
    if (user?.uid) {
      await updateUserTheme({ userId: user.uid, theme });
      await startNewGame(level);
    }
  }}
  isPremium={isPremium}
  onUpgradeClick={() => {
    window.location.href = '/subscribe';
  }}
/>
```

## Paystack Configuration

### Subscription Plans

**Monthly Plan:**
- **Price:** NGN 2,000
- **Interval:** month
- **Plan Code:** (configured in Paystack dashboard)

**Yearly Plan:**
- **Price:** NGN 20,000
- **Interval:** year
- **Discount:** 17% (2 months free)
- **Plan Code:** (configured in Paystack dashboard)

### Payment Flow

1. User clicks "Subscribe" on plan
2. PaystackButton component initializes
3. Paystack popup opens
4. User enters payment details
5. Payment processed
6. Webhook updates user profile
7. `isPremium` set to `true` in Firestore
8. User can now access all themes

## Database Schema

### User Profile Updates

When user subscribes:
```typescript
{
  userId: string;
  isPremium: true,              // ← Set to true
  subscriptionPlan: 'monthly',  // or 'yearly'
  subscriptionStatus: 'active',
  subscriptionStartDate: Timestamp,
  subscriptionEndDate: Timestamp,
  selectedTheme: 'current',     // User can now change this
  usedWords: string[],
  // ... other fields
}
```

## Testing

### Test Premium Access

1. **Manually set premium status:**
   ```typescript
   // In Firestore Console
   userProfiles/{userId}
   {
     isPremium: true
   }
   ```

2. **Verify theme access:**
   - Login to game
   - See theme selector
   - All themes should be unlocked
   - No lock icons
   - Can select any theme

### Test Upgrade Flow

1. **Set user as free:**
   ```typescript
   userProfiles/{userId}
   {
     isPremium: false
   }
   ```

2. **Test upgrade flow:**
   - Login to game
   - Click on premium theme
   - Verify upgrade dialog appears
   - Click "View Premium Plans"
   - Verify redirects to `/subscribe`
   - Verify subscription plans show themes

### Test Payment Integration

1. **Use Paystack test mode**
2. **Test card:** 4084084084084081
3. **Complete payment**
4. **Verify webhook updates user**
5. **Verify `isPremium` is true**
6. **Verify themes are unlocked**

## Webhook Configuration

### Paystack Webhook Endpoint

**URL:** `https://your-domain.com/api/paystack/webhook`

**Events to listen for:**
- `subscription.create` - New subscription
- `subscription.disable` - Subscription cancelled
- `subscription.not_renew` - Subscription ending
- `charge.success` - Payment successful

### Webhook Handler

**File:** `src/app/api/paystack/webhook/route.ts`

**Actions:**
1. Verify webhook signature
2. Parse event data
3. Update user profile in Firestore
4. Set `isPremium` based on subscription status
5. Log transaction

## Premium Features

### What Premium Users Get

**Word Themes:**
- 🔬 Science Safari
- 🏛️ History Quest
- 🌍 Geo Genius
- 📚 Current Theme (free users get this too)

**Other Benefits:**
- Unlimited hints
- Ad-free experience
- Advanced statistics
- Custom badges
- Priority support (yearly)
- Early access to features (yearly)

### What Free Users Get

**Word Themes:**
- 📚 Current Theme only

**Other Features:**
- Limited hints (can purchase packs)
- Ads shown
- Basic statistics

## Marketing Copy

### Theme Selector Dialog

**Title:** 🎓 Premium Word Themes

**Description:**
"Unlock themed word generation to focus your learning! Choose from science, history, or geography themes."

**Call to Action:**
"View Premium Plans"

### Subscribe Page

**Headline:**
"Upgrade to Premium"

**Subheadline:**
"Unlock themed word generation, unlimited hints, and ad-free experience"

**Theme Showcase:**
🔬 Science Safari  🏛️ History Quest  🌍 Geo Genius

### Subscription Plans

**Monthly Plan:**
"Premium Monthly - NGN 2,000/month"
- Perfect for trying premium features
- All word themes included
- Cancel anytime

**Yearly Plan:**
"Premium Yearly - NGN 20,000/year"
- Save 17% (2 months free!)
- Best value for committed learners
- All premium features
- Priority support

## Analytics Events

### Track Theme Interest

```typescript
// When user clicks premium theme
analytics.logEvent('premium_theme_clicked', {
  theme: 'science-safari',
  isPremium: false,
});

// When upgrade dialog shown
analytics.logEvent('upgrade_dialog_shown', {
  source: 'theme_selector',
  attemptedTheme: 'history-quest',
});

// When user clicks "View Premium Plans"
analytics.logEvent('upgrade_button_clicked', {
  source: 'theme_dialog',
});

// When user lands on subscribe page
analytics.logEvent('subscribe_page_viewed', {
  referrer: 'theme_selector',
});
```

## Conversion Funnel

1. **Theme Interest** - User clicks premium theme
2. **Dialog View** - Upgrade dialog shown
3. **Intent** - User clicks "View Premium Plans"
4. **Page View** - Subscribe page loaded
5. **Plan Selection** - User clicks subscribe button
6. **Payment** - Paystack popup shown
7. **Conversion** - Payment successful

## Optimization Tips

### Increase Conversions

1. **Show theme value early**
   - Display theme examples in dialog
   - Show sample words from each theme

2. **Reduce friction**
   - One-click to subscribe page
   - Pre-select popular plan
   - Show money-back guarantee

3. **Create urgency**
   - Limited-time discount
   - Show how many users upgraded
   - Highlight exclusive features

4. **Social proof**
   - Show testimonials
   - Display user count
   - Show theme popularity

## Troubleshooting

### Theme Not Unlocking After Payment

**Check:**
1. Is webhook configured correctly?
2. Is `isPremium` updated in Firestore?
3. Is user logged in with correct account?
4. Check webhook logs for errors

**Solution:**
```typescript
// Manually verify user status
const userDoc = await getDoc(doc(firestore, 'userProfiles', userId));
console.log('Premium status:', userDoc.data()?.isPremium);
```

### Upgrade Button Not Working

**Check:**
1. Is `onUpgradeClick` prop passed?
2. Is redirect URL correct?
3. Check browser console for errors

**Solution:**
```typescript
// Verify redirect
console.log('Redirecting to:', '/subscribe');
window.location.href = '/subscribe';
```

### Paystack Not Loading

**Check:**
1. Is Paystack public key set?
2. Is PaystackButton component loaded?
3. Check network tab for script errors

**Solution:**
```typescript
// Verify Paystack key
console.log('Paystack key:', process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);
```

## Future Enhancements

### Potential Improvements

1. **Trial Period**
   - 7-day free trial of premium themes
   - Auto-convert to paid after trial

2. **Theme Previews**
   - Show sample words before subscribing
   - Let users try one theme for free

3. **Referral Program**
   - Give free month for referrals
   - Unlock themes by referring friends

4. **Bundle Deals**
   - Theme + hints bundle
   - Family plan with multiple accounts

5. **Gift Subscriptions**
   - Buy premium for a friend
   - Gift cards for themes

## Status

✅ **COMPLETE AND INTEGRATED**

- ✅ Theme selector links to subscribe page
- ✅ Upgrade dialog shows theme benefits
- ✅ Subscribe page highlights themes
- ✅ Subscription plans include themes
- ✅ Paystack payment integration
- ✅ Premium gate working
- ✅ Theme unlocking on payment

**Premium word themes are now fully integrated with Paystack subscriptions!** 🎉
