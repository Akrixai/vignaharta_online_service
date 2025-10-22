# Image Alt Text Guidelines

This document provides guidelines for implementing comprehensive alt text for all images in the Vignaharta Online Services website to improve SEO and accessibility.

## Current Images and Their Alt Text

### Public Directory Images

| Image File | Current Usage | Recommended Alt Text |
|------------|---------------|---------------------|
| `/vignaharta.jpg` | Website logo | "Vignaharta Online Services - Government Service Portal Logo" |
| `/vignaharta.png` | Website logo | "Vignaharta Online Services - Government Service Portal Logo" |
| `/apple-touch-icon.png` | Mobile home screen icon | "Vignaharta Online Services App Icon" |
| `/favicon.ico` | Browser tab icon | "Vignaharta Online Services Favicon" |
| `/akrixPayQR.jpg` | Payment QR code | "Akrix Pay QR Code for Government Service Payments" |

### Images Directory

| Image File | Current Usage | Recommended Alt Text |
|------------|---------------|---------------------|
| `/images/government-services-1.jpg` | Landing page carousel | "Indian citizen accessing digital government services online" |
| `/images/government-services-2.jpg` | Landing page carousel | "Government service portal interface with document processing" |
| `/images/government-services-3.jpg` | Landing page carousel | "Secure digital government services with encryption protection" |

## Implementation Plan

### 1. Update Existing Image Components

All `next/image` components should include descriptive alt text:

```tsx
// Before
<Image src={image.url} alt="" />

// After
<Image 
  src={image.url} 
  alt={image.altText || "Descriptive alt text for the image"} 
/>
```

### 2. Database Schema Update

Add alt_text column to advertisements table:

```sql
ALTER TABLE login_advertisements ADD COLUMN alt_text TEXT;
```

### 3. API Response Enhancement

Update API responses to include alt_text field:

```json
{
  "advertisements": [
    {
      "id": "1",
      "title": "Digital India Services",
      "image_url": "/images/government-services-1.jpg",
      "alt_text": "Indian citizen accessing digital government services online",
      "description": "Experience seamless government services at your fingertips"
    }
  ]
}
```

## Best Practices for Alt Text

1. **Be descriptive but concise** - Focus on what's important in the image
2. **Context matters** - Alt text should match the image's purpose on the page
3. **Decorative images** - Use empty alt="" for purely decorative images
4. **Functional images** - Describe what the image represents or does
5. **Avoid redundancy** - Don't repeat information already provided in text
6. **Include text in images** - If an image contains text, include it in the alt text

## SEO Benefits

1. **Improved accessibility** for visually impaired users
2. **Better search engine indexing** of image content
3. **Enhanced user experience** for all users
4. **Higher rankings** in image search results
5. **Compliance with WCAG** accessibility standards

## Implementation Status

- [x] Created image directory structure
- [x] Copied placeholder images with descriptive filenames
- [ ] Update Image components with proper alt text
- [ ] Add alt_text field to database schema
- [ ] Update API responses to include alt_text
- [ ] Create admin interface for managing alt text
- [ ] Test alt text implementation across all pages