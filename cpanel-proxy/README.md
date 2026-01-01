# InsPay PAN Card API Proxy Setup Guide

This proxy solution allows your Vercel-hosted Next.js application to use InsPay PAN card APIs through your cPanel hosting with a static IP.

## Problem Solved
- Vercel has dynamic IPs which InsPay cannot whitelist
- Your cPanel hosting (`api.akrixsolutions.in`) has a static IP
- This proxy routes API calls through your cPanel to InsPay

## Files to Upload to cPanel

Upload all files in this `cpanel-proxy` folder to your cPanel hosting at `api.akrixsolutions.in`:

### 1. PHP Proxy Files
- `new_pan.php` - Handles new PAN requests
- `correction.php` - Handles PAN correction requests  
- `incomplete.php` - Handles incomplete PAN requests

### 2. Configuration Files
- `.htaccess` - Apache configuration for CORS and security
- `404.php` - Custom 404 error handler
- `500.php` - Custom 500 error handler

## cPanel Setup Instructions

### Step 1: Upload Files
1. Login to your cPanel at your hosting provider
2. Go to **File Manager**
3. Navigate to `public_html` directory
4. Create a new folder or use existing structure
5. Upload all the PHP files to the root of your domain or subdirectory

### Step 2: Set File Permissions
Set the following permissions:
- PHP files: `644` (read/write for owner, read for group/others)
- `.htaccess`: `644`
- Directory: `755` (read/write/execute for owner, read/execute for group/others)

### Step 3: Test PHP and cURL
1. Go to **cPanel > Software > Select PHP Version**
2. Ensure PHP 7.4+ is selected
3. Enable the following PHP extensions:
   - `curl` (required for API calls)
   - `json` (required for JSON handling)
   - `openssl` (required for HTTPS)

### Step 4: Get Your Static IP
1. In cPanel, go to **General Information** or **Server Information**
2. Note down your **Server IP Address**
3. This is the IP you need to provide to InsPay for whitelisting

### Step 5: Configure InsPay Dashboard
1. Login to your InsPay dashboard
2. Go to **API Details** section
3. Update the **White list IP Address** field with your cPanel server IP
4. Save the configuration

## API Endpoints

After deployment, your proxy endpoints will be:

```
https://api.akrixsolutions.in/cpanel-proxy/new_pan.php
https://api.akrixsolutions.in/cpanel-proxy/correction.php  
https://api.akrixsolutions.in/cpanel-proxy/incomplete.php
```

## Testing the Proxy

Test each endpoint using curl or Postman:

```bash
# Test New PAN API
curl "https://api.akrixsolutions.in/cpanel-proxy/new_pan.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&number=9876543210&mode=EKYC&orderid=TEST123"

# Test Correction API
curl "https://api.akrixsolutions.in/cpanel-proxy/correction.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&number=9876543210&mode=EKYC&orderid=TEST123"

# Test Incomplete API
curl "https://api.akrixsolutions.in/cpanel-proxy/incomplete.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&orderid=TEST123"
```

## Security Features

The proxy includes:
- CORS headers for cross-origin requests
- Input validation for required parameters
- Error handling for cURL failures
- Security headers (X-Frame-Options, X-XSS-Protection)
- No-cache headers for API responses

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**
   - Check PHP error logs in cPanel
   - Ensure cURL extension is enabled
   - Verify file permissions

2. **CORS Errors**
   - Ensure `.htaccess` file is uploaded
   - Check if mod_headers is enabled in Apache

3. **API Not Working**
   - Verify your cPanel IP is whitelisted in InsPay
   - Check InsPay credentials in the URL parameters
   - Test direct InsPay API access from cPanel server

4. **File Not Found (404)**
   - Ensure files are in the correct directory
   - Check file names and extensions
   - Verify URL structure

### Checking Logs:
1. Go to cPanel > **Errors**
2. Check **Error Logs** for PHP errors
3. Check **Access Logs** for request patterns

## Next.js Application Changes

Your Next.js application has been updated to use the proxy:
- `INSPAY_PROXY_URL` environment variable added
- `InspayService` class updated to use proxy endpoints
- All API calls now route through your cPanel proxy

## Maintenance

- Monitor error logs regularly
- Keep PHP version updated
- Backup proxy files before making changes
- Test after any cPanel/hosting updates