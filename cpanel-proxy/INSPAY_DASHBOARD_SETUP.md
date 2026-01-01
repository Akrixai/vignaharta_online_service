# InsPay Dashboard Configuration Guide

## Step-by-Step Setup

### 1. Login to InsPay Dashboard
- Go to: `https://connect.inspay.in/`
- Login with your credentials:
  - Username: `IP9819399470`
  - Password: `[Your Password]`

### 2. Navigate to API Details
- Click on **"Developer API"** or **"API Details"** section
- Look for **"Set Call Back URL"** option

### 3. Configure Callback URLs

#### Server to Server Call Back URL:
```
https://api.akrixsolutions.in/cpanel-proxy/callback.php?txid=YOUR ORDER ID&status=Success/Failure&opid=OPERATOR ID
```

**Important Notes:**
- This URL receives real-time status updates from InsPay
- When a PAN application is completed/failed, InsPay will call this URL
- The proxy forwards the callback to your Vercel application
- This enables real-time status updates in your PAN history

#### Pan Card Redirection URL:
```
https://api.akrixsolutions.in/cpanel-proxy/redirect.php?txid=YOUR ORDER ID&status=Success/Failure&opid=OPERATOR ID
```

**Important Notes:**
- This URL is where users are redirected after completing PAN application
- Users will be redirected back to your application's history page
- The proxy handles the redirect and shows appropriate success/failure messages

### 4. Whitelist IP Address

#### Get Your cPanel Server IP:
1. Login to your cPanel
2. Go to **"General Information"** or **"Server Information"**
3. Note down the **"Server IP Address"**
4. Example: `142.132.248.161` (replace with your actual IP)

#### Add IP to InsPay Whitelist:
1. In InsPay dashboard, find **"White list IP Address"** field
2. Enter your cPanel server IP address
3. Click **"Update Details"**

### 5. Verify Configuration

After saving, your InsPay dashboard should show:

```
API Username: IP9819399470
API Token: 1998ff964beca8baf895edd6955b6e20
White list IP Address: [Your cPanel Server IP]

Server to server Call Back URL:
https://api.akrixsolutions.in/cpanel-proxy/callback.php?txid=YOUR ORDER ID&status=Success/Failure&opid=OPERATOR ID

Pan Card Redirection URL:
https://api.akrixsolutions.in/cpanel-proxy/redirect.php?txid=YOUR ORDER ID&status=Success/Failure&opid=OPERATOR ID
```

## How It Works

### 1. API Calls Flow:
```
Your App → cPanel Proxy → InsPay API → Response → cPanel Proxy → Your App
```

### 2. Callback Flow:
```
InsPay → cPanel Proxy (callback.php) → Your Vercel App → Database Update
```

### 3. Redirect Flow:
```
InsPay → cPanel Proxy (redirect.php) → Your App History Page
```

## Testing the Setup

### 1. Test API Endpoints:
```bash
# Test if proxy is working
curl "https://api.akrixsolutions.in/cpanel-proxy/test.php"

# Test PAN API
curl "https://api.akrixsolutions.in/cpanel-proxy/new_pan.php?username=IP9819399470&token=1998ff964beca8baf895edd6955b6e20&number=9876543210&mode=EKYC&orderid=TEST123"
```

### 2. Test Callback:
```bash
# Simulate InsPay callback
curl "https://api.akrixsolutions.in/cpanel-proxy/callback.php?txid=12345&status=Success&opid=OP123"
```

### 3. Test Redirect:
```bash
# Test redirect (should return 302 redirect)
curl -I "https://api.akrixsolutions.in/cpanel-proxy/redirect.php?txid=12345&status=Success&opid=OP123"
```

## Troubleshooting

### Common Issues:

1. **"IP not whitelisted" Error:**
   - Verify your cPanel server IP is correct
   - Wait 5-10 minutes after adding IP to whitelist
   - Contact InsPay support if issue persists

2. **Callbacks Not Working:**
   - Check `callback_logs.txt` file in your cPanel
   - Verify callback URL is correctly set in InsPay dashboard
   - Ensure your Vercel app is accessible

3. **Redirects Not Working:**
   - Check `redirect_logs.txt` file in your cPanel
   - Verify redirect URL is correctly set in InsPay dashboard
   - Test redirect URL manually

### Log Files:
Your cPanel proxy creates these log files for debugging:
- `callback_logs.txt` - Incoming callbacks from InsPay
- `callback_forward_logs.txt` - Callback forwarding to Vercel
- `redirect_logs.txt` - User redirects from InsPay

## Security Notes

1. **IP Whitelisting:** Only your cPanel server IP can access InsPay APIs
2. **HTTPS Only:** All communications use HTTPS encryption
3. **Parameter Validation:** Proxy validates all incoming parameters
4. **Error Handling:** Proper error responses for invalid requests

## Support

If you encounter issues:
1. Check the log files in your cPanel
2. Verify all URLs are correctly configured
3. Test each component individually
4. Contact InsPay support for API-related issues
5. Contact your hosting provider for cPanel/server issues