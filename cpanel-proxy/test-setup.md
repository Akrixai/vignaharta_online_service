# Quick Test Guide

## 1. Test Basic Proxy
Visit: `https://api.akrixsolutions.in/cpanel-proxy/test.php`
Should show server information and cURL test results.

## 2. Test Callback Proxy
Visit: `https://api.akrixsolutions.in/cpanel-proxy/callback.php?txid=TEST123&status=Success&opid=OP456`
Should forward to your Vercel app and return JSON response.

## 3. Test Redirect Proxy  
Visit: `https://api.akrixsolutions.in/cpanel-proxy/redirect.php?txid=TEST123&status=Success&opid=OP456`
Should redirect to your PAN history page.

## 4. Test PAN API Proxy
Visit: `https://api.akrixsolutions.in/cpanel-proxy/new_pan.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&number=9876543210&mode=EKYC&orderid=TEST123`
Should return InsPay API response.

## Expected Results:
- ✅ All URLs should be accessible (no 404 errors)
- ✅ Callback should forward to Vercel and return JSON
- ✅ Redirect should redirect to your history page
- ✅ API proxy should return InsPay response