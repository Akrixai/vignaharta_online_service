# ⚠️ RESTART REQUIRED

## Changes Made to next.config.js

The Content Security Policy (CSP) has been updated to allow Cashfree payment gateway integration.

### What was added:
- Cashfree SDK scripts: `https://sdk.cashfree.com`
- Cashfree API endpoints: `https://sandbox.cashfree.com` and `https://api.cashfree.com`
- Cashfree payment modal iframes: `https://sandbox.cashfree.com` and `https://payments.cashfree.com`
- Google reCAPTCHA: `https://www.google.com` and `https://www.gstatic.com`

## 🔄 Action Required:

**You MUST restart your development server for these changes to take effect:**

1. Stop the current dev server (Ctrl+C)
2. Run: `npm run dev`
3. Try the payment again

The Cashfree payment modal should now load properly without CSP errors.

---

**Note:** If you're deploying to production, make sure to:
1. Deploy the updated `next.config.js`
2. Clear any CDN/edge caches
3. Test the payment flow in production environment
