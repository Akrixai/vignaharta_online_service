# Vignaharta Online Service - API Documentation

**Base URL:** `https://vighnahartaonlineservice.in`

**API Version:** 1.0

**Last Updated:** November 2024

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users API](#users-api)
3. [Wallet API](#wallet-api)
4. [Wallet Requests API](#wallet-requests-api)
5. [Transactions API](#transactions-api)
6. [Schemes API](#schemes-api)
7. [Applications API](#applications-api)
8. [Products API](#products-api)
9. [Orders API](#orders-api)
10. [Certificates API](#certificates-api)
11. [Training Videos API](#training-videos-api)
12. [Advertisements API](#advertisements-api)
13. [Queries API](#queries-api)
14. [Receipts API](#receipts-api)
15. [Refunds API](#refunds-api)
16. [Notifications API](#notifications-api)
17. [Payment API](#payment-api)
18. [Webhooks](#webhooks)

---

## Authentication

All API endpoints (except public ones) require authentication using NextAuth.js session cookies.

### Session-based Authentication
- The application uses NextAuth.js for session management
- Sessions are stored as HTTP-only cookies
- Include credentials in requests: `credentials: 'include'`

### User Roles
- `ADMIN` - Full system access
- `EMPLOYEE` - Can process applications, manage users
- `RETAILER` - Can apply for schemes, manage own applications

---

## Users API

### GET /api/users
Get all users (Admin only)

**Authentication:** Required (Admin)

**Query Parameters:**
- `role` (optional): Filter by role (ADMIN, EMPLOYEE, RETAILER)
- `search` (optional): Search by name or email
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "1234567890",
      "role": "RETAILER",
      "is_active": true,
      "address": "123 Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "occupation": "Business",
      "employee_id": null,
      "department": null,
      "branch": "Mumbai",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### POST /api/users
Create new user (Admin only)

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "name": "Jane Doe",
  "phone": "9876543210",
  "role": "EMPLOYEE",
  "address": "456 Avenue",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001",
  "employee_id": "EMP001",
  "department": "Operations",
  "branch": "Delhi"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "role": "EMPLOYEE"
  }
}
```

### GET /api/users/[id]
Get user by ID

**Authentication:** Required

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "1234567890",
    "role": "RETAILER",
    "is_active": true,
    "address": "123 Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

### PUT /api/users/[id]
Update user

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "9999999999",
  "address": "New Address",
  "city": "Pune",
  "state": "Maharashtra",
  "pincode": "411001"
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "phone": "9999999999"
  }
}
```

### DELETE /api/users/[id]
Delete user (Admin only)

**Authentication:** Required (Admin)

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

## Wallet API

### GET /api/wallet
Get user's wallet balance

**Authentication:** Required

**Response:**
```json
{
  "wallet": {
    "id": "uuid",
    "user_id": "uuid",
    "balance": 1500.00,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/wallet
Create wallet request for approval

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 1000.00,
  "type": "TOPUP",
  "payment_method": "UPI",
  "transaction_reference": "TXN123456",
  "screenshot_url": "/public/uploads/payment_screenshot.jpg"
}
```

**Response:**
```json
{
  "message": "Wallet request created successfully",
  "request": {
    "id": "uuid",
    "amount": 1000.00,
    "status": "PENDING"
  }
}
```


### POST /api/wallet/payment-verification
Submit payment verification for wallet top-up

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 1000.00,
  "payment_method": "UPI",
  "transaction_id": "TXN123456789",
  "screenshot_url": "/public/uploads/payment_proof.jpg"
}
```

**Response:**
```json
{
  "message": "Payment verification submitted successfully",
  "verification": {
    "id": "uuid",
    "status": "PENDING"
  }
}
```

### POST /api/wallet/withdraw
Request wallet withdrawal

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 500.00,
  "bank_details": {
    "account_number": "1234567890",
    "ifsc_code": "BANK0001234",
    "account_holder_name": "John Doe"
  }
}
```

**Response:**
```json
{
  "message": "Withdrawal request submitted",
  "request_id": "uuid"
}
```

### POST /api/wallet/create-order
Create Razorpay order for wallet top-up

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 1000.00
}
```

**Response:**
```json
{
  "orderId": "order_xyz123",
  "amount": 100000,
  "currency": "INR",
  "key": "rzp_test_key"
}
```

### POST /api/wallet/verify-payment
Verify Razorpay payment

**Authentication:** Required

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "message": "Payment verified successfully",
  "wallet": {
    "balance": 2000.00
  }
}
```

---

## Wallet Requests API

### GET /api/wallet-requests
Get wallet requests

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED)
- `type` (optional): Filter by type (TOPUP, WITHDRAWAL)
- `user_id` (optional): Filter by user (Admin/Employee only)

**Response:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "TOPUP",
      "amount": 1000.00,
      "status": "PENDING",
      "payment_method": "UPI",
      "transaction_reference": "TXN123",
      "screenshot_url": "/public/uploads/screenshot.jpg",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/wallet-requests
Create new wallet request

**Authentication:** Required

**Request Body:**
```json
{
  "type": "TOPUP",
  "amount": 1000.00,
  "payment_method": "UPI",
  "transaction_reference": "TXN123456",
  "screenshot_url": "/public/uploads/payment.jpg",
  "description": "Wallet top-up via UPI"
}
```

**Response:**
```json
{
  "message": "Wallet request created successfully",
  "request": {
    "id": "uuid",
    "status": "PENDING"
  }
}
```

### PUT /api/wallet-requests
Process wallet request (Admin/Employee only)

**Authentication:** Required (Admin/Employee)

**Request Body:**
```json
{
  "request_id": "uuid",
  "action": "approve",
  "reject_reason": null
}
```

**Response:**
```json
{
  "message": "Wallet request approved successfully",
  "request": {
    "id": "uuid",
    "status": "APPROVED"
  }
}
```

---

## Transactions API

### GET /api/transactions
Get user's transactions

**Authentication:** Required

**Query Parameters:**
- `type` (optional): Filter by type (DEPOSIT, WITHDRAWAL, SCHEME_PAYMENT, REFUND, COMMISSION)
- `status` (optional): Filter by status
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "wallet_id": "uuid",
      "type": "DEPOSIT",
      "amount": 1000.00,
      "status": "COMPLETED",
      "description": "Wallet top-up",
      "reference": "TXN123",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

### POST /api/transactions
Create new transaction

**Authentication:** Required

**Request Body:**
```json
{
  "type": "DEPOSIT",
  "amount": 1000.00,
  "description": "Wallet top-up",
  "reference": "TXN123456"
}
```

**Response:**
```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "id": "uuid",
    "amount": 1000.00,
    "status": "COMPLETED"
  }
}
```

### GET /api/transactions/commission
Get commission transactions for current user

**Authentication:** Required (Retailer)

**Response:**
```json
{
  "commissions": [
    {
      "id": "uuid",
      "amount": 50.00,
      "description": "Commission for application #123",
      "status": "COMPLETED",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_earned": 500.00
}
```

---

## Schemes API

### GET /api/schemes
Get all active schemes

**Authentication:** Required

**Query Parameters:**
- `category` (optional): Filter by category
- `is_free` (optional): Filter free schemes (true/false)
- `search` (optional): Search by name

**Response:**
```json
{
  "schemes": [
    {
      "id": "uuid",
      "name": "PAN Card Application",
      "description": "Apply for new PAN card",
      "price": 107.00,
      "is_free": false,
      "is_active": true,
      "category": "Government Services",
      "processing_time_days": 7,
      "commission_rate": 10.00,
      "image_url": "/public/images/pan_card.jpg",
      "required_documents": [
        {
          "id": "doc1",
          "label": "Aadhar Card",
          "required": true
        }
      ],
      "dynamic_fields": [
        {
          "id": "field1",
          "label": "Full Name",
          "type": "text",
          "required": true
        }
      ]
    }
  ]
}
```

### POST /api/schemes
Create new scheme (Admin only)

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Passport Application",
  "description": "Apply for new passport",
  "price": 1500.00,
  "is_free": false,
  "category": "Government Services",
  "processing_time_days": 30,
  "commission_rate": 5.00,
  "image_url": "/public/images/passport.jpg",
  "required_documents": [],
  "dynamic_fields": []
}
```

**Response:**
```json
{
  "message": "Scheme created successfully",
  "scheme": {
    "id": "uuid",
    "name": "Passport Application"
  }
}
```

### GET /api/schemes/[id]
Get scheme details

**Authentication:** Required

**Response:**
```json
{
  "scheme": {
    "id": "uuid",
    "name": "PAN Card Application",
    "description": "Apply for new PAN card",
    "price": 107.00,
    "is_free": false,
    "category": "Government Services",
    "required_documents": [],
    "dynamic_fields": []
  }
}
```

---

## Applications API

### GET /api/applications
Get applications

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status
- `scheme_id` (optional): Filter by scheme
- `from_date` (optional): Start date
- `to_date` (optional): End date

**Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "scheme_id": "uuid",
      "scheme_name": "PAN Card Application",
      "customer_name": "John Doe",
      "customer_phone": "1234567890",
      "status": "PENDING",
      "amount": 107.00,
      "commission_amount": 10.70,
      "commission_paid": false,
      "form_data": {},
      "documents": [],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/applications
Create new application

**Authentication:** Required (Retailer)

**Request Body:**
```json
{
  "scheme_id": "uuid",
  "customer_name": "John Doe",
  "customer_phone": "1234567890",
  "customer_email": "john@example.com",
  "customer_address": "123 Street, City",
  "form_data": {
    "field1": "value1",
    "field2": "value2"
  },
  "documents": [
    "/public/uploads/aadhar.pdf",
    "/public/uploads/photo.jpg"
  ],
  "dynamic_field_documents": {
    "field1": ["/public/uploads/doc1.pdf"]
  }
}
```

**Response:**
```json
{
  "message": "Application submitted successfully",
  "application": {
    "id": "uuid",
    "status": "PENDING"
  }
}
```

### GET /api/applications/[id]
Get application details

**Authentication:** Required

**Response:**
```json
{
  "application": {
    "id": "uuid",
    "scheme_name": "PAN Card Application",
    "customer_name": "John Doe",
    "status": "APPROVED",
    "amount": 107.00,
    "form_data": {},
    "documents": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### PATCH /api/applications/[id]
Update application status (Admin/Employee only)

**Authentication:** Required (Admin/Employee)

**Request Body:**
```json
{
  "status": "APPROVED",
  "notes": "Application approved"
}
```

**Response:**
```json
{
  "message": "Application updated successfully",
  "application": {
    "id": "uuid",
    "status": "APPROVED"
  }
}
```

---

## Products API

### GET /api/products
Get active products

**Authentication:** Required

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search by name

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Biometric Device",
      "description": "Fingerprint scanner for authentication",
      "price": 2500.00,
      "image_url": "/public/images/biometric.jpg",
      "category": "Hardware",
      "is_active": true,
      "stock_quantity": 50,
      "features": ["USB connectivity", "Fast scanning"]
    }
  ]
}
```

### GET /api/products/[id]
Get product details

**Authentication:** Required

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "name": "Biometric Device",
    "description": "Fingerprint scanner",
    "price": 2500.00,
    "stock_quantity": 50
  }
}
```

---

## Orders API

### GET /api/orders
Get orders

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "product_id": "uuid",
      "product_name": "Biometric Device",
      "quantity": 1,
      "amount": 2500.00,
      "delivery_charges": 100.00,
      "payment_method": "WALLET",
      "status": "PENDING",
      "customer_details": {
        "name": "John Doe",
        "phone": "1234567890",
        "address": "123 Street"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/orders
Create new order

**Authentication:** Required

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 1,
  "payment_method": "WALLET",
  "customer_details": {
    "name": "John Doe",
    "phone": "1234567890",
    "address": "123 Street, City, State - 400001"
  }
}
```

**Response:**
```json
{
  "message": "Order placed successfully",
  "order": {
    "id": "uuid",
    "status": "PENDING"
  }
}
```

### GET /api/orders/[id]
Get order details

**Authentication:** Required

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "product_name": "Biometric Device",
    "quantity": 1,
    "amount": 2500.00,
    "status": "SHIPPED",
    "tracking_number": "TRACK123"
  }
}
```

### PATCH /api/orders/[id]
Update order status (Admin/Employee only)

**Authentication:** Required (Admin/Employee)

**Request Body:**
```json
{
  "status": "SHIPPED",
  "tracking_number": "TRACK123456"
}
```

**Response:**
```json
{
  "message": "Order updated successfully"
}
```


---

## Certificat