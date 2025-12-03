# Quick Reference Guide - Recharge Plans Implementation

## 🎯 Understanding Your Current Setup

### API Endpoint
```
GET /api/recharge/plans?operator_code=1&circle_code=4&service_type=PREPAID
```

### Request Parameters
- `operator_code` - KWIKAPI operator ID (required)
- `circle_code` - Circle code for mobile (required for mobile, optional for DTH)
- `service_type` - PREPAID, POSTPAID, or DTH

### Response Structure
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "code": "FULLTT",
        "name": "All-in-One",
        "icon": "🎯",
        "order": 1,
        "plans": [...]
      }
    ]
  }
}
```

## 📋 Plan Categories Reference

### Mobile Prepaid Categories

| Code | Name | Icon | Typical Plans |
|------|------|------|---------------|
| FULLTT | All-in-One | 🎯 | ₹155, ₹299, ₹399, ₹499, ₹666, ₹719 |
| TOPUP | Top-up | 💰 | ₹10, ₹20, ₹30, ₹50, ₹100 |
| DATA | Data | 📊 | ₹48, ₹98, ₹118, ₹181, ₹251 |
| SMS | SMS | 💬 | ₹10, ₹20, ₹30 |
| RATE_CUTTER | Rate Cutter | ✂️ | ₹11, ₹21, ₹31 |
| 2G | 2G | 📱 | ₹65, ₹108, ₹128 |
| Romaing | Roaming | ✈️ | ₹11, ₹21, ₹51, ₹101 |
| COMBO | Combo | 🎁 | ₹28, ₹48, ₹98 |
| FRC | First Recharge | 🆕 | ₹95, ₹155, ₹222 |
| JioPhone | JioPhone | 📞 | ₹75, ₹125, ₹222, ₹333 |
| STV | Special | ⭐ | ₹22, ₹33, ₹44 |

### DTH Categories

| Code | Name | Icon | Typical Plans |
|------|------|------|---------------|
| FULLTT | All-in-One | 🎯 | ₹299, ₹399, ₹499, ₹599 |
| TOPUP | Top-up | 💰 | ₹100, ₹200, ₹300, ₹500 |
| STV | Special | ⭐ | ₹153, ₹222, ₹333 |

## 🔧 Implementation Checklist

### Current Implementation ✅
- [x] Horizontal category filters
- [x] Auto-load plans on operator/circle selection
- [x] Category-based filtering
- [x] Plan selection with auto-fill
- [x] Responsive design
- [x] Loading states
- [x] Error handling

### Enhanced Version Adds ✨
- [x] Full-width plans section below form
- [x] "All Plans" category option
- [x] Grid layout (1-4 columns)
- [x] Popular badges on common amounts
- [x] Enhanced category button design
- [x] Better mobile scrolling
- [x] Smooth animations
- [x] Auto-scroll to form on mobile

## 🎨 Design Tokens

### Colors
```css
/* Primary (Mobile) */
--blue-600: #2563eb
--blue-700: #1d4ed8

/* Primary (DTH) */
--purple-600: #9333ea
--purple-700: #7e22ce

/* Accent */
--orange-500: #f97316  /* Popular badge */
--green-100: #dcfce7  /* Validity badge bg */
--green-800: #166534  /* Validity badge text */

/* Neutral */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-600: #4b5563
--gray-700: #374151
```

### Spacing
```css
/* Category buttons */
padding: 1.25rem 1rem  /* py-5 px-4 */
gap: 0.75rem           /* gap-3 */
border-radius: 1rem    /* rounded-2xl */

/* Plan cards */
padding: 1.25rem       /* p-5 */
gap: 1rem              /* gap-4 */
border-radius: 0.75rem /* rounded-xl */
```

## 📱 Responsive Breakpoints

```css
/* Grid columns */
grid-cols-1           /* Mobile: < 640px */
sm:grid-cols-2        /* Tablet: 640px+ */
lg:grid-cols-3        /* Desktop: 1024px+ */
xl:grid-cols-4        /* Large: 1280px+ */
```

## 🔍 Debugging the 500 Error

### Step 1: Check API Key
```bash
# In .env file
KWIKAPI_KEY=your-actual-key-here
```

### Step 2: Test KWIKAPI Directly
```bash
curl -X POST https://www.kwikapi.com/api/v2/recharge_plans.php \
  -F "api_key=YOUR_KEY" \
  -F "opid=1" \
  -F "state_code=4"
```

### Step 3: Check Operator Mapping
```typescript
// Ensure kwikapi_opid is set correctly
const operator = operators.find(op => op.id === selectedOperator);
console.log('Operator:', operator);
console.log('KWIKAPI OPID:', operator.kwikapi_opid);
```

### Step 4: Add Error Logging
```typescript
// In src/app/api/recharge/plans/route.ts
try {
  const response = await fetch(`${KWIKAPI_BASE_URL}/recharge_plans.php`, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  console.log('KWIKAPI Response:', data);  // Add this
  
  if (!data.success) {
    console.error('KWIKAPI Error:', data);  // Add this
    return NextResponse.json(...);
  }
} catch (error) {
  console.error('Fetch Error:', error);  // Add this
}
```

## 🚀 Quick Start Guide

### To Use Enhanced Version

1. **Backup current files:**
```bash
cd src/app/dashboard/recharge
cp mobile/page.tsx mobile/page-backup.tsx
cp dth/page.tsx dth/page-backup.tsx
```

2. **Replace with enhanced:**
```bash
cp mobile/page-enhanced.tsx mobile/page.tsx
cp dth/page-enhanced.tsx dth/page.tsx
```

3. **Test in browser:**
```
http://localhost:3000/dashboard/recharge/mobile
http://localhost:3000/dashboard/recharge/dth
```

4. **If issues, rollback:**
```bash
cp mobile/page-backup.tsx mobile/page.tsx
cp dth/page-backup.tsx dth/page.tsx
```

## 📊 Component Structure

### Enhanced Page Structure
```
MobileRechargePage
├── Service Type Tabs (PREPAID/POSTPAID)
├── Form Section
│   ├── Mobile Number + Auto Detect
│   ├── Operator Selection
│   ├── Circle Selection
│   ├── Amount Input
│   ├── Customer Name
│   ├── Reward Preview
│   └── Submit Button
└── Plans Section (Full Width)
    ├── Category Filters (Horizontal)
    │   ├── All Plans Button
    │   └── Category Buttons (with icons)
    └── Plans Grid (Responsive)
        └── Plan Cards
            ├── Amount
            ├── Validity Badge
            ├── Description
            ├── Type Badge
            ├── Popular Badge (conditional)
            └── Selected Indicator
```

## 🎯 User Flow

1. User selects service type (PREPAID/POSTPAID)
2. User enters mobile number
3. User clicks "Auto Detect" (optional)
4. User selects operator and circle
5. **Plans load automatically** ⚡
6. User sees horizontal category filters
7. User clicks category to filter (or "All Plans")
8. User sees plans in grid layout
9. User clicks a plan card
10. Amount auto-fills in form
11. User clicks "Proceed to Recharge"

## 💡 Pro Tips

### Tip 1: Popular Plans
The enhanced version automatically marks these amounts as "POPULAR":
- Mobile: ₹299, ₹399, ₹499
- DTH: ₹299, ₹399, ₹499, ₹599

### Tip 2: Color Coding
- **Blue theme** = Mobile recharge
- **Purple theme** = DTH recharge
- **Orange badge** = Popular plans
- **Green badge** = Validity

### Tip 3: Mobile UX
On mobile devices, when a plan is selected:
- Page auto-scrolls to top
- Amount is filled
- User can immediately submit

### Tip 4: Category Order
Categories are sorted by the `order` field in the API response:
1. All-in-One (most popular)
2. Top-up
3. Data
4. SMS
5. Others...

## 🔗 Related Files

### API Routes
- `src/app/api/recharge/plans/route.ts` - Plans API
- `src/app/api/recharge/operators/route.ts` - Operators API
- `src/app/api/recharge/circles/route.ts` - Circles API
- `src/app/api/recharge/process/route.ts` - Process recharge

### Pages
- `src/app/dashboard/recharge/mobile/page.tsx` - Mobile recharge
- `src/app/dashboard/recharge/dth/page.tsx` - DTH recharge
- `src/app/dashboard/recharge/page.tsx` - Main recharge page

### Documentation
- `KWIKAPI-Integration.md` - Full KWIKAPI docs
- `KWIKAPI-Analysis-and-Recommendations.md` - Analysis
- `IMPLEMENTATION-SUMMARY.md` - Summary
- `QUICK-REFERENCE.md` - This file

## 📞 Need Help?

Common issues and solutions:

### Issue: Plans not loading
**Solution:** Check operator and circle codes match KWIKAPI

### Issue: 500 error
**Solution:** Verify API key and KWIKAPI service status

### Issue: Categories not showing
**Solution:** Check API response structure

### Issue: Plans not filtering
**Solution:** Verify selectedCategory state

### Issue: Mobile layout broken
**Solution:** Check Tailwind CSS classes and responsive breakpoints

---

**Quick Tip:** The enhanced version is production-ready! Just fix the KWIKAPI 500 error and you're good to go. 🚀
