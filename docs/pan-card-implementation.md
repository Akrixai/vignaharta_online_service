# PAN Card Services Implementation Guide

## Overview
This document explains the complete implementation of PAN card services including API integration, callback handling, and redirection URL configuration.

## PAN Card Redirection URL Format

The PAN card service provider (InsPay) sends callbacks to your application with the following URL format:

```
https://yourdomain.com/api/pan-services/callback?txid=YOUR_ORDER_ID&status=Success/Failure&opid=OPERATOR_ID
```

### URL Parameters:
- `txid`: Transaction ID from InsPay (matches the `inspay_txid` in your database)
- `status`: Either "Success" or "Failure"
- `opid`: Operator ID from InsPay (optional)

## Implementation Components

### 1. Database Schema

#### PAN Commission Configuration Table (`pan_commission_config`)
```sql
CREATE TABLE pan_commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type pan_service_type NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### PAN Services Table (`pan_services`)
```sql
CREATE TABLE pan_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    service_type pan_service_type NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status pan_service_status DEFAULT 'PENDING',
    inspay_txid VARCHAR(100),
    inspay_opid VARCHAR(100),
    inspay_url TEXT,
    mobile_number VARCHAR(15),
    mode VARCHAR(10),
    error_message TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. API Endpoints

#### Admin Configuration API (`/api/admin/pan-commission`)
- **GET**: Fetch all PAN commission configurations
- **POST**: Create new configuration
- **PUT**: Update existing configuration
- **DELETE**: Delete configuration

#### PAN Services APIs
- **POST** `/api/pan-services/new-pan`: New PAN application
- **POST** `/api/pan-services/correction`: PAN correction
- **POST** `/api/pan-services/incomplete-pan`: Resume incomplete PAN
- **GET** `/api/pan-services/history`: Get PAN services history
- **GET/POST** `/api/pan-services/callback`: Handle InsPay callbacks

### 3. Callback Handler Implementation

The callback handler (`/api/pan-services/callback/route.ts`) processes the following:

1. **Receives callback parameters** from InsPay
2. **Finds the PAN service record** using `inspay_txid`
3. **Updates service status** based on callback status
4. **Processes commission** if transaction is successful
5. **Updates wallet balance** and creates transaction records

#### Callback Flow:
```typescript
// 1. Extract parameters
const txid = searchParams.get('txid');
const status = searchParams.get('status');
const opid = searchParams.get('opid');

// 2. Find PAN service record
const { data: panService } = await supabase
  .from('pan_services')
  .select('*')
  .eq('inspay_txid', txid)
  .single();

// 3. Update status and process commission
if (status.toLowerCase() === 'success') {
  // Update service status to SUCCESS
  // Add commission to user's wallet
  // Create commission transaction record
} else {
  // Update service status to FAILURE
  // Log error message
}
```

### 4. Frontend Components

#### Admin PAN Commission Configuration Page
- **Location**: `/dashboard/admin/pan-commission`
- **Features**:
  - View all PAN service configurations
  - Add/Edit/Delete configurations
  - Set pricing and commission rates
  - Enable/Disable services

#### PAN Services History Page
- **Location**: `/dashboard/pan-services/history`
- **Features**:
  - View all PAN applications
  - Filter by status and service type
  - Track application progress
  - Continue incomplete applications

### 5. Sidebar Navigation Updates

The sidebar has been updated to include:
- **Admin Section**: "PAN Commission Config" under Admin - Configuration
- **PAN Services Section**: Properly grouped PAN services for authorized users

## Configuration Steps

### 1. Database Setup
Run the migration file to create required tables:
```sql
-- Execute: database/migrations/add_pan_services.sql
```

### 2. Environment Configuration
Ensure InsPay API credentials are configured in your environment:
```env
INSPAY_USERNAME=your_username
INSPAY_TOKEN=your_token
INSPAY_BASE_URL=https://connect.inspay.in/v4
```

### 3. Callback URL Configuration
Configure the callback URL in InsPay dashboard:
```
https://yourdomain.com/api/pan-services/callback
```

### 4. Admin Configuration
1. Login as admin
2. Navigate to `/dashboard/admin/pan-commission`
3. Configure pricing and commission rates for each service type:
   - New PAN Application
   - PAN Correction
   - Incomplete PAN Resume

## Service Types and Modes

### Service Types:
1. **NEW_PAN**: First-time PAN card application
2. **PAN_CORRECTION**: Update existing PAN card details
3. **INCOMPLETE_PAN**: Resume incomplete PAN applications

### Application Modes:
1. **EKYC**: PAN without signature (faster processing)
2. **ESIGN**: PAN with signature and photo (complete application)

## Commission Processing

When a PAN application is successful:
1. Commission is calculated based on configured rate
2. Amount is added to retailer's wallet
3. Transaction record is created for audit trail
4. User receives notification of commission credit

## Error Handling

The system handles various error scenarios:
- Invalid callback parameters
- Missing PAN service records
- InsPay API failures
- Wallet update failures
- Database transaction errors

## Security Considerations

1. **Access Control**: PAN services restricted to authorized retailers
2. **Callback Validation**: Verify callback authenticity
3. **Transaction Integrity**: Atomic operations for wallet updates
4. **Audit Trail**: Complete logging of all transactions

## Testing

### Test Callback URL:
```bash
curl -X GET "https://yourdomain.com/api/pan-services/callback?txid=TEST123&status=Success&opid=OP123"
```

### Expected Response:
```json
{
  "success": true,
  "message": "PAN service success callback processed",
  "data": {
    "txid": "TEST123",
    "status": "SUCCESS",
    "opid": "OP123",
    "order_id": "USER_ORDER_ID",
    "service_type": "NEW_PAN"
  }
}
```

## Monitoring and Analytics

Track the following metrics:
- Total PAN applications processed
- Success/failure rates by service type
- Commission amounts distributed
- Average processing times
- User adoption rates

## Support and Troubleshooting

Common issues and solutions:
1. **Callback not received**: Check InsPay configuration
2. **Commission not credited**: Verify wallet update logic
3. **Application stuck in processing**: Check InsPay status
4. **Access denied errors**: Verify user permissions

## Future Enhancements

Potential improvements:
1. Real-time status updates via WebSocket
2. SMS/Email notifications for status changes
3. Bulk PAN application processing
4. Advanced analytics dashboard
5. Integration with additional PAN service providers