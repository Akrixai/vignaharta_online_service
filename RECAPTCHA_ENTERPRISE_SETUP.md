# Google reCAPTCHA Enterprise Setup Guide

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Login with your Google account
3. Select your project: **primal-outrider-475914-a2** (or create new one)

### Step 2: Enable reCAPTCHA Enterprise API
1. In the search bar at top, search for "reCAPTCHA Enterprise API"
2. Click on "reCAPTCHA Enterprise API"
3. Click "Enable" button
4. Wait for API to be enabled (takes 1-2 minutes)

### Step 3: Create reCAPTCHA Key
1. Go to: https://console.cloud.google.com/security/recaptcha
2. Click "Create Key" button
3. Fill in the form:
   - **Display name**: Vighnaharta Online Services
   - **Platform type**: Select "Website"
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - `yourdomain.com` (for production)
     - `*.yourdomain.com` (for subdomains)
   - **reCAPTCHA type**: Select "Score-based (v3)"
   - **Security preference**: Select "Most secure"

4. Click "Create"

### Step 4: Get Your Keys
After creating, you'll see:
- **Site Key** (Public key - starts with 6Le...)
- Copy this key

### Step 5: Create API Key for Backend Verification
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Click "Restrict Key" (recommended)
5. Under "API restrictions":
   - Select "Restrict key"
   - Choose "reCAPTCHA Enterprise API"
6. Click "Save"

### Step 6: Update Your .env File
```env
# Google reCAPTCHA Enterprise
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LeYPwksAAAAAPH-jIsASA6II6ljU4vKi5vIOf3p"
RECAPTCHA_SECRET_KEY="your_api_key_from_step_5"
NEXT_PUBLIC_RECAPTCHA_PROJECT_ID="primal-outrider-475914-a2"
```

### Step 7: Restart Your Application
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

## Verify It's Working

1. Go to login page
2. Open browser console (F12)
3. You should see reCAPTCHA badge in bottom-right corner
4. Try to login - should work without errors

## Troubleshooting

### Error: "Could not connect to reCAPTCHA service"
**Solution**: 
- Check if API is enabled in Google Cloud Console
- Verify domain is added to allowed domains
- Check if site key is correct in .env

### Error: "Invalid site key"
**Solution**:
- Make sure you're using the correct site key
- Verify the key is for reCAPTCHA Enterprise (not v2 or v3)

### Error: "API key not valid"
**Solution**:
- Create a new API key
- Make sure it's restricted to reCAPTCHA Enterprise API only

## Current Configuration

You're using:
- **Project ID**: primal-outrider-475914-a2
- **Site Key**: 6LeYPwksAAAAAPH-jIsASA6II6ljU4vKi5vIOf3p

You need to:
1. Get the API key from Google Cloud Console
2. Update RECAPTCHA_SECRET_KEY in .env
3. Restart your application

---

## Alternative: Use Standard reCAPTCHA v3 (Simpler)

If Enterprise is too complex, you can use standard v3:

1. Go to: https://www.google.com/recaptcha/admin
2. Click "+" to create new site
3. Choose "reCAPTCHA v3"
4. Add domains
5. Get Site Key and Secret Key
6. Update .env:
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your_v3_site_key"
   RECAPTCHA_SECRET_KEY="your_v3_secret_key"
   ```
7. Remove `useEnterprise={true}` from login and register pages

Standard v3 is easier to set up and works the same way!
