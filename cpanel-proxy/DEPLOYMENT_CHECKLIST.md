# InsPay Proxy Deployment Checklist

## Pre-Deployment

- [ ] Backup existing cPanel files
- [ ] Verify cPanel hosting is active
- [ ] Confirm PHP 7.4+ is available
- [ ] Check available disk space

## cPanel Setup

### 1. File Upload
- [ ] Login to cPanel File Manager
- [ ] Navigate to `public_html` directory
- [ ] Upload all proxy files:
  - [ ] `new_pan.php`
  - [ ] `correction.php`
  - [ ] `incomplete.php`
  - [ ] `callback.php` (for InsPay callbacks)
  - [ ] `redirect.php` (for PAN card redirections)
  - [ ] `.htaccess`
  - [ ] `404.php`
  - [ ] `500.php`
  - [ ] `test.php`

### 2. File Permissions
- [ ] Set PHP files to `644` permissions
- [ ] Set `.htaccess` to `644` permissions
- [ ] Set directory to `755` permissions

### 3. PHP Configuration
- [ ] Go to cPanel > Select PHP Version
- [ ] Ensure PHP 7.4+ is selected
- [ ] Enable required extensions:
  - [ ] `curl`
  - [ ] `json`
  - [ ] `openssl`

### 4. Get Server IP
- [ ] Note down server IP from cPanel General Information
- [ ] Server IP: `___________________`

## InsPay Configuration

- [ ] Login to InsPay dashboard
- [ ] Navigate to API Details section
- [ ] Update White list IP Address with your cPanel server IP
- [ ] Set Server to server Call Back URL: `https://api.akrixsolutions.in/cpanel-proxy/callback.php?txid=YOUR ORDER ID&status=Success/Failure&opid=OPERATOR ID`
- [ ] Set Pan Card Redirection URL: `https://api.akrixsolutions.in/cpanel-proxy/redirect.php?txid=YOUR ORDER ID&status=Success/Failure&opid=OPERATOR ID`
- [ ] Save configuration
- [ ] Wait for IP whitelisting to take effect (may take a few minutes)

## Testing

### 1. Basic Proxy Test
- [ ] Visit: `https://api.akrixsolutions.in/cpanel-proxy/test.php`
- [ ] Verify all tests show "Working" status
- [ ] Check server IP matches what you provided to InsPay

### 2. API Endpoint Tests
Replace `YOUR_CREDENTIALS` with actual values:

- [ ] Test New PAN:
```
https://api.akrixsolutions.in/cpanel-proxy/new_pan.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&number=9876543210&mode=EKYC&orderid=TEST123
```

- [ ] Test Correction:
```
https://api.akrixsolutions.in/cpanel-proxy/correction.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&number=9876543210&mode=EKYC&orderid=TEST123
```

- [ ] Test Incomplete:
```
https://api.akrixsolutions.in/cpanel-proxy/incomplete.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&orderid=TEST123
```

- [ ] Test Callback (simulate InsPay callback):
```
https://api.akrixsolutions.in/cpanel-proxy/callback.php?txid=12345&status=Success&opid=OP123
```

- [ ] Test Redirect:
```
https://api.akrixsolutions.in/cpanel-proxy/redirect.php?txid=12345&status=Success&opid=OP123
```

### 3. Expected Responses
- [ ] APIs return JSON responses
- [ ] No CORS errors in browser console
- [ ] HTTP status codes are appropriate (200 for success, 400/500 for errors)

## Next.js Application

### 1. Environment Variables
- [ ] Add `INSPAY_PROXY_URL=https://api.akrixsolutions.in/cpanel-proxy` to `.env`
- [ ] Update Vercel environment variables if deployed
- [ ] Restart development server to load new env vars

### 2. Code Verification
- [ ] Verify `src/lib/inspay.ts` uses proxy URL
- [ ] Test PAN services in your application
- [ ] Check browser network tab for correct proxy URLs

## Production Deployment

### 1. Vercel Environment
- [ ] Add `INSPAY_PROXY_URL=https://api.akrixsolutions.in/cpanel-proxy` to Vercel env vars
- [ ] Redeploy application
- [ ] Test PAN services on production

### 2. Monitoring
- [ ] Set up cPanel error log monitoring
- [ ] Monitor API response times
- [ ] Check for any 500 errors in logs

## Troubleshooting

If tests fail:

1. **500 Internal Server Error**
   - [ ] Check cPanel Error Logs
   - [ ] Verify file permissions
   - [ ] Ensure cURL is enabled

2. **CORS Issues**
   - [ ] Verify `.htaccess` is uploaded
   - [ ] Check Apache mod_headers is enabled

3. **API Authentication Errors**
   - [ ] Verify InsPay credentials
   - [ ] Confirm IP is whitelisted
   - [ ] Test direct InsPay API access

4. **Network Issues**
   - [ ] Check cPanel server connectivity
   - [ ] Verify SSL certificates
   - [ ] Test with different networks

## Post-Deployment

- [ ] Document server IP for future reference
- [ ] Set up monitoring alerts
- [ ] Schedule regular testing
- [ ] Backup proxy files

## Contact Information

- cPanel Hosting Support: `___________________`
- InsPay Support: `___________________`
- Server IP Address: `___________________`
- Deployment Date: `___________________`