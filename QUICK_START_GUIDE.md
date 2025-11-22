# Quick Start Guide - New Features

## For Retailers

### Using the Referral System

1. **Generate Your Referral Code:**
   - Login to your dashboard
   - Navigate to "Referrals" in the sidebar
   - Click "Generate My Referral Code"
   - Your unique code will be created instantly

2. **Share Your Referral Link:**
   - Copy your referral link using the "Copy Link" button
   - Share via WhatsApp, SMS, Email, or social media
   - Format: `https://yoursite.com/register?ref=YOUR_CODE`

3. **Track Your Referrals:**
   - View total referrals sent
   - See successful registrations
   - Check total rewards earned
   - All stats update in real-time

4. **Earn Rewards:**
   - When someone registers using your code
   - Both you and the new user get rewards
   - Rewards are automatically credited to wallets
   - No manual claiming required

### Viewing the Leaderboard

1. **Access the Leaderboard:**
   - Visit `/leaderboard` on the main website
   - No login required to view

2. **Check Your Ranking:**
   - See top 3 performers with special badges
   - View your position if you're in top 10
   - Filter by month and year
   - Badges update automatically each month

3. **Understand Badges:**
   - 🏆 Gold Champion - Rank 1
   - 🥈 Silver Star - Rank 2
   - 🥉 Bronze Achiever - Rank 3
   - ⭐ Rising Star - Fast growing
   - 💎 Top Performer - Consistent excellence

---

## For Customers

### Browsing Products

1. **Visit Products Page:**
   - Go to `/products` on the main website
   - No login required to browse

2. **Filter Products:**
   - Click category buttons to filter
   - View product details, prices, features
   - Check stock availability

3. **Purchase Products:**
   - Click on any product
   - You'll be redirected to login/register
   - Complete registration to access full catalog

### Understanding How It Works

1. **View Process Steps:**
   - Scroll to "How It Works" section on homepage
   - See 5-step process with timelines
   - Desktop: Hover over steps for details
   - Mobile: Tap steps to expand

2. **Process Timeline:**
   - Step 1: Visit Retailer (5 min)
   - Step 2: Submit Documents (10-15 min)
   - Step 3: Make Payment (2 min)
   - Step 4: Track Application (Ongoing)
   - Step 5: Receive Service (7-15 days)

---

## For Admins

### Configuring Referral Rewards

1. **Access Configuration:**
   - Login as admin
   - Navigate to `/dashboard/admin/referral-config`

2. **Set Reward Amounts:**
   - Referrer Reward: Amount for person who refers
   - Referred User Reward: Amount for new user
   - Enter amounts in rupees
   - Click "Save" for each setting

3. **Enable/Disable System:**
   - Toggle referral system on/off
   - Changes take effect immediately
   - Existing referrals remain valid

### Managing Leaderboard

1. **Auto-Calculation:**
   - Leaderboard updates automatically each month
   - Based on applications processed
   - Rankings calculated at month-end

2. **Manual Recalculation:**
   - POST to `/api/leaderboard`
   - Requires admin authentication
   - Use for corrections or updates

### Product Showcase Management

1. **Add Products:**
   - Use existing product management
   - Products automatically appear on public page
   - Set featured status for prominence

2. **Track Analytics:**
   - View counts tracked automatically
   - Click tracking for conversion analysis
   - Access via product analytics dashboard

---

## For Developers

### Using Progress Bar Component

```typescript
import ApplicationProgressBar from '@/components/ApplicationProgressBar';

<ApplicationProgressBar
  currentStep={3}
  totalSteps={5}
  steps={['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']}
  onStepClick={(step) => setCurrentStep(step)}
/>
```

### Using Draft Auto-Save Hook

```typescript
import { useApplicationDraft } from '@/hooks/useApplicationDraft';

const {
  draftData,
  updateDraft,
  saveDraft,
  clearDraft,
  isSaving,
  lastSaved,
  hasUnsavedChanges
} = useApplicationDraft({
  schemeId: 'your-scheme-id',
  autoSaveInterval: 30000, // 30 seconds
  enableLocalStorage: true
});

// Update draft
updateDraft({ fieldName: 'value' });

// Manual save
await saveDraft(progressPercentage);

// Clear draft
clearDraft();
```

### Complete Form with Progress

```typescript
import ApplicationFormWithProgress from '@/components/ApplicationFormWithProgress';

<ApplicationFormWithProgress
  schemeId="scheme-id"
  schemeName="Service Name"
  onSubmit={async (data) => {
    // Handle submission
  }}
/>
```

---

## API Endpoints Reference

### Referral System
```
POST   /api/referrals/generate-code  - Generate referral code
GET    /api/referrals/generate-code  - Get existing code
POST   /api/referrals/submit         - Submit referral
```

### Leaderboard
```
GET    /api/leaderboard              - Get leaderboard
POST   /api/leaderboard              - Recalculate (admin)
```

### Products
```
GET    /api/products/public          - Get public products
POST   /api/products/public          - Track view
```

### Application Drafts
```
GET    /api/applications/draft       - Get drafts
POST   /api/applications/draft       - Save draft
```

### Configuration
```
GET    /api/config?category=REFERRAL - Get referral config
PUT    /api/config                   - Update config (admin)
```

---

## Database Tables

### New Tables Created

1. **referral_codes**
   - Stores unique referral codes
   - Tracks referral statistics
   - Links to users table

2. **referrals**
   - Tracks referral relationships
   - Stores reward amounts
   - Manages reward payment status

3. **monthly_leaderboard**
   - Monthly performance data
   - Badge assignments
   - Ranking information

4. **application_drafts**
   - Draft application data
   - Progress tracking
   - Auto-expiration (30 days)

5. **product_showcase**
   - Product display settings
   - View/click tracking
   - Featured product flags

---

## Troubleshooting

### Referral Code Not Generating
- Check user authentication
- Verify user role (RETAILER)
- Check database connection
- Review API logs

### Draft Not Saving
- Check localStorage availability
- Verify authentication token
- Check network connection
- Review browser console

### Leaderboard Not Updating
- Wait for month-end calculation
- Trigger manual recalculation
- Check application data
- Verify date ranges

### Products Not Showing
- Verify products are active
- Check product_showcase table
- Review API response
- Check category filters

---

## Best Practices

### For Retailers
- Share referral links regularly
- Track your performance monthly
- Use draft feature for complex applications
- Review leaderboard for motivation

### For Admins
- Set competitive reward amounts
- Monitor referral system usage
- Review leaderboard monthly
- Update product showcase regularly

### For Developers
- Use TypeScript for type safety
- Implement error handling
- Test auto-save functionality
- Monitor API performance

---

## Support

### Getting Help
- Check documentation first
- Review error messages
- Check browser console
- Contact support team

### Reporting Issues
- Provide detailed description
- Include error messages
- Share reproduction steps
- Attach screenshots if helpful

---

## Updates & Maintenance

### Regular Tasks
- Monitor referral system usage
- Update reward amounts as needed
- Review leaderboard accuracy
- Clean up expired drafts
- Update product information

### Monthly Tasks
- Verify leaderboard calculation
- Review referral statistics
- Analyze product views
- Update featured products

---

## Security Notes

### Data Protection
- All data encrypted in transit
- Secure authentication required
- RLS policies enforced
- Input validation implemented

### Privacy
- Earnings not displayed publicly
- Personal data protected
- GDPR compliant
- User consent managed

---

This guide covers all new features. For detailed technical documentation, refer to FEATURES_IMPLEMENTATION_SUMMARY.md
