# Remaining Operator Categories Implementation Plan

## Overview
Based on the analysis of the KwikAPI biller list and current codebase, we need to implement the following operator categories:

### Categories to Implement:
1. **Gas Bill Payment** (30+ operators) - 🔥
2. **Water Bill Payment** (50+ operators) - 💧  
3. **Broadband Bill Payment** (80+ operators) - 🌐
4. **Landline Bill Payment** (10+ operators) - ☎️
5. **Insurance Premium Payment** (5+ operators) - 🛡️

## Implementation Strategy

### 1. Database Updates
- Update `kwikapi_billers` table with missing operators
- Add commission/cashback configuration for each category
- Update `recharge_operators` table to include new service types

### 2. Frontend Implementation
- Create separate pages for each category following electricity pattern
- Update dashboard to show LIVE badges instead of SOON
- Add to sidebar menu under "Recharge & Bills" section
- Implement dynamic field handling for each operator

### 3. Backend API Updates
- Extend existing KwikAPI integration
- Add bill fetch support for operators that support it
- Implement commission and cashback logic per category

### 4. Admin Configuration
- Add commission rate configuration per category
- Add cashback percentage configuration per category
- Category-level settings that apply to all operators in that category

## Technical Implementation Details

### Database Schema Updates

```sql
-- Add new service types to enum
ALTER TYPE recharge_service_type ADD VALUE 'GAS';
ALTER TYPE recharge_service_type ADD VALUE 'WATER';  
ALTER TYPE recharge_service_type ADD VALUE 'BROADBAND';
ALTER TYPE recharge_service_type ADD VALUE 'LANDLINE';
ALTER TYPE recharge_service_type ADD VALUE 'INSURANCE';

-- Add category-level commission configuration
CREATE TABLE IF NOT EXISTS category_commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type recharge_service_type NOT NULL UNIQUE,
    commission_rate NUMERIC(5,2) DEFAULT 2.00,
    cashback_enabled BOOLEAN DEFAULT false,
    cashback_min_percentage NUMERIC(5,2) DEFAULT 0.50,
    cashback_max_percentage NUMERIC(5,2) DEFAULT 2.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Frontend Structure

Each category will have:
- `/dashboard/recharge/gas/page.tsx`
- `/dashboard/recharge/water/page.tsx` 
- `/dashboard/recharge/broadband/page.tsx`
- `/dashboard/recharge/landline/page.tsx`
- `/dashboard/recharge/insurance/page.tsx`

### API Endpoints

Extend existing endpoints:
- `/api/recharge/operators` - Add service_type filter for new categories
- `/api/kwikapi/bill-fetch` - Support new operator types
- `/api/kwikapi/bill-payment` - Handle new service types

### Admin Configuration Pages

- `/dashboard/admin/category-commission` - Configure commission per category
- Category-level settings that automatically apply to all operators

## Implementation Priority

1. **Gas Bill Payment** - High demand utility service
2. **Water Bill Payment** - Essential utility service  
3. **Broadband Bill Payment** - Popular telecom service
4. **Landline Bill Payment** - Traditional telecom service
5. **Insurance Premium Payment** - Financial service

## Key Features

### Bill Fetch Support
- Automatic bill details retrieval for supported operators
- Manual amount entry fallback for non-supported operators
- Dynamic field handling based on operator requirements

### Commission & Cashback
- Category-level commission rates (admin configurable)
- Customer cashback (1-3% random within configured range)
- Retailer commission (2-5% based on category)

### User Experience
- Same intuitive flow as electricity bill payment
- Real-time transaction processing
- Instant receipt generation
- Transaction history tracking

## Files to Create/Update

### New Pages
- `src/app/dashboard/recharge/gas/page.tsx`
- `src/app/dashboard/recharge/water/page.tsx`
- `src/app/dashboard/recharge/broadband/page.tsx`
- `src/app/dashboard/recharge/landline/page.tsx`
- `src/app/dashboard/recharge/insurance/page.tsx`

### Database Migrations
- `database/migrations/add_remaining_operator_categories.sql`
- `database/migrations/create_category_commission_config.sql`
- `database/migrations/populate_kwikapi_billers_remaining.sql`

### Admin Pages
- `src/app/dashboard/admin/category-commission/page.tsx`

### API Updates
- Update existing API endpoints to handle new service types
- No new endpoints needed - reuse existing infrastructure

## Success Metrics

- All 5 categories implemented and live
- Commission/cashback working per category
- Bill fetch working for supported operators
- Admin can configure rates per category
- Users can pay bills seamlessly
- Transaction success rate >95%

## Timeline

- **Week 1**: Database setup + Gas bill payment
- **Week 2**: Water + Broadband bill payment  
- **Week 3**: Landline + Insurance bill payment
- **Week 4**: Admin configuration + testing
- **Week 5**: Production deployment + monitoring

This implementation will complete the bill payment ecosystem and provide users with comprehensive utility bill payment options.