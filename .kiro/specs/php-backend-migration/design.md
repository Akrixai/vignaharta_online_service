# PHP Backend Migration - Design Document

## Overview

This document outlines the technical design for migrating the Vignaharta Online Service backend from Next.js API routes to a standalone PHP REST API. The new system will maintain all existing functionality while providing a more traditional PHP-based architecture suitable for cPanel hosting environments.

### Design Goals

1. **Compatibility**: Maintain 100% API compatibility with existing frontend
2. **Security**: Implement JWT-based authentication with role-based access control
3. **Performance**: Optimize database queries and implement caching where appropriate
4. **Maintainability**: Use clean architecture with separation of concerns
5. **Scalability**: Design for future growth and feature additions

### Technology Stack

- **Language**: PHP 8.0+
- **Database**: MySQL 8.0+ (existing vignaharta_db)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local filesystem (public/uploads directory)
- **Payment Gateway**: Razorpay API
- **Environment Management**: PHP dotenv library

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│                  React Components + Pages                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS (JSON)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    PHP REST API Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Router (index.php)                       │  │
│  │         URL Routing & Request Handling               │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │           Middleware Layer                            │  │
│  │  • CORS Handler                                       │  │
│  │  • JWT Authentication                                 │  │
│  │  • Request Validation                                 │  │
│  │  • Error Handler                                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │           Controllers Layer                           │  │
│  │  • AuthController                                     │  │
│  │  • UsersController                                    │  │
│  │  • WalletController                                   │  │
│  │  • ApplicationsController                             │  │
│  │  • SchemesController                                  │  │
│  │  • [20+ Controllers]                                  │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │           Services Layer                              │  │
│  │  • Business Logic                                     │  │
│  │  • Transaction Management                             │  │
│  │  • External API Integration                           │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │           Models/Repositories Layer                   │  │
│  │  • Database Queries                                   │  │
│  │  • Data Validation                                    │  │
│  │  • ORM-like Operations                                │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  MySQL Database                               │
│                  (vignaharta_db)                              │
└───────────────────────────────────────────────────────────────┘
```

### Directory Structure


```
php-api/
├── public/
│   └── index.php                 # Entry point
├── src/
│   ├── Config/
│   │   ├── Database.php          # Database connection
│   │   ├── Config.php            # App configuration
│   │   └── Routes.php            # Route definitions
│   ├── Middleware/
│   │   ├── AuthMiddleware.php    # JWT authentication
│   │   ├── CorsMiddleware.php    # CORS handling
│   │   ├── RoleMiddleware.php    # Role-based access
│   │   └── ValidationMiddleware.php
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── UsersController.php
│   │   ├── WalletController.php
│   │   ├── WalletRequestsController.php
│   │   ├── TransactionsController.php
│   │   ├── SchemesController.php
│   │   ├── ApplicationsController.php
│   │   ├── CertificatesController.php
│   │   ├── ProductsController.php
│   │   ├── OrdersController.php
│   │   ├── PaymentController.php
│   │   ├── AdvertisementsController.php
│   │   ├── TrainingVideosController.php
│   │   ├── NotificationsController.php
│   │   ├── QueriesController.php
│   │   ├── ReceiptsController.php
│   │   ├── RefundsController.php
│   │   ├── BranchesController.php
│   │   ├── RegistrationsController.php
│   │   ├── DocumentsController.php
│   │   ├── UploadController.php
│   │   └── AnalyticsController.php
│   ├── Services/
│   │   ├── AuthService.php
│   │   ├── WalletService.php
│   │   ├── ApplicationService.php
│   │   ├── PaymentService.php
│   │   ├── CertificateService.php
│   │   ├── NotificationService.php
│   │   └── FileUploadService.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Wallet.php
│   │   ├── WalletRequest.php
│   │   ├── Transaction.php
│   │   ├── Scheme.php
│   │   ├── Application.php
│   │   ├── Certificate.php
│   │   ├── Product.php
│   │   ├── Order.php
│   │   └── [Other Models]
│   ├── Utils/
│   │   ├── JWTHelper.php
│   │   ├── Validator.php
│   │   ├── Response.php
│   │   └── FileHelper.php
│   └── Exceptions/
│       ├── AuthException.php
│       ├── ValidationException.php
│       └── DatabaseException.php
├── vendor/                       # Composer dependencies
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── composer.json                 # PHP dependencies
├── composer.lock
└── README.md                     # API documentation
```

## Components and Interfaces

### 1. Router Component

**Purpose**: Handle incoming HTTP requests and route to appropriate controllers

**Key Features**:
- Parse URL paths and extract parameters
- Match HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Support for dynamic route parameters (e.g., /api/users/{id})
- Middleware execution pipeline

**Interface**:
```php
class Router {
    public function addRoute(string $method, string $path, callable $handler): void
    public function addMiddleware(callable $middleware): void
    public function dispatch(Request $request): Response
    private function matchRoute(string $method, string $path): ?array
}
```

### 2. Authentication Middleware

**Purpose**: Validate JWT tokens and extract user information

**Key Features**:
- JWT token validation
- Token expiration checking
- User session management
- Public route bypass

**Interface**:
```php
class AuthMiddleware {
    public function handle(Request $request, callable $next): Response
    private function extractToken(Request $request): ?string
    private function validateToken(string $token): ?array
    private function isPublicRoute(string $path): bool
}
```

### 3. Database Connection Manager

**Purpose**: Manage MySQL database connections using PDO

**Key Features**:
- Singleton pattern for connection reuse
- Prepared statement support
- Transaction management
- Connection pooling

**Interface**:
```php
class Database {
    public static function getInstance(): Database
    public function getConnection(): PDO
    public function beginTransaction(): void
    public function commit(): void
    public function rollback(): void
    public function query(string $sql, array $params = []): PDOStatement
}
```

### 4. Base Controller

**Purpose**: Provide common functionality for all controllers

**Key Features**:
- Request parsing
- Response formatting
- Error handling
- Authentication context

**Interface**:
```php
abstract class BaseController {
    protected Database $db;
    protected ?array $user;
    
    protected function json(array $data, int $status = 200): Response
    protected function error(string $message, int $status = 400): Response
    protected function requireAuth(): void
    protected function requireRole(array $roles): void
    protected function validate(array $data, array $rules): array
}
```

### 5. Model Base Class

**Purpose**: Provide ORM-like functionality for database operations

**Key Features**:
- CRUD operations
- Query builder
- Relationship handling
- Data validation

**Interface**:
```php
abstract class Model {
    protected string $table;
    protected string $primaryKey = 'id';
    protected array $fillable = [];
    
    public function find(string $id): ?array
    public function findBy(string $column, $value): ?array
    public function all(array $conditions = []): array
    public function create(array $data): array
    public function update(string $id, array $data): bool
    public function delete(string $id): bool
    protected function query(): QueryBuilder
}
```



## Data Models

### Core Models

#### User Model
```php
class User extends Model {
    protected string $table = 'users';
    protected array $fillable = [
        'email', 'password_hash', 'name', 'phone', 'role',
        'is_active', 'address', 'city', 'state', 'pincode',
        'date_of_birth', 'gender', 'occupation', 'employee_id',
        'department', 'branch', 'created_by'
    ];
    
    public function wallet(): ?array
    public function applications(): array
    public function transactions(): array
    public function verifyPassword(string $password): bool
}
```

#### Wallet Model
```php
class Wallet extends Model {
    protected string $table = 'wallets';
    protected array $fillable = ['user_id', 'balance'];
    
    public function addBalance(float $amount): bool
    public function deductBalance(float $amount): bool
    public function getBalance(): float
    public function transactions(): array
}
```

#### Application Model
```php
class Application extends Model {
    protected string $table = 'applications';
    protected array $fillable = [
        'user_id', 'scheme_id', 'form_data', 'documents',
        'dynamic_field_documents', 'status', 'amount',
        'customer_name', 'customer_phone', 'customer_email',
        'customer_address', 'commission_rate', 'commission_amount'
    ];
    
    public function scheme(): ?array
    public function user(): ?array
    public function certificate(): ?array
    public function approve(string $approvedBy): bool
    public function reject(string $rejectedBy, string $reason): bool
}
```

#### Scheme Model
```php
class Scheme extends Model {
    protected string $table = 'schemes';
    protected array $fillable = [
        'name', 'description', 'price', 'is_free', 'is_active',
        'category', 'processing_time_days', 'commission_rate',
        'dynamic_fields', 'required_documents', 'image_url',
        'external_url'
    ];
    
    public function applications(): array
    public function isActive(): bool
    public function calculateCommission(float $amount): float
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTHENTICATION_FAILED | 401 | Invalid or missing JWT token |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks required role |
| RESOURCE_NOT_FOUND | 404 | Requested resource doesn't exist |
| VALIDATION_ERROR | 400 | Input validation failed |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| INSUFFICIENT_BALANCE | 400 | Wallet balance too low |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

### Exception Hierarchy

```php
class ApiException extends Exception {
    protected int $statusCode = 500;
    protected string $errorCode = 'INTERNAL_ERROR';
    
    public function getStatusCode(): int
    public function getErrorCode(): string
    public function toArray(): array
}

class AuthException extends ApiException {
    protected int $statusCode = 401;
    protected string $errorCode = 'AUTHENTICATION_FAILED';
}

class ValidationException extends ApiException {
    protected int $statusCode = 400;
    protected string $errorCode = 'VALIDATION_ERROR';
    protected array $errors = [];
    
    public function setErrors(array $errors): void
}

class NotFoundException extends ApiException {
    protected int $statusCode = 404;
    protected string $errorCode = 'RESOURCE_NOT_FOUND';
}
```

## Testing Strategy

### Unit Testing

**Framework**: PHPUnit

**Coverage Areas**:
- Model CRUD operations
- Service layer business logic
- Utility functions (JWT, validation, file handling)
- Exception handling

**Example Test Structure**:
```php
class UserModelTest extends TestCase {
    public function testCreateUser()
    public function testFindUserById()
    public function testVerifyPassword()
    public function testUpdateUser()
}
```

### Integration Testing

**Coverage Areas**:
- API endpoint responses
- Database transactions
- Authentication flow
- File upload operations
- Payment gateway integration

**Example Test Structure**:
```php
class AuthApiTest extends TestCase {
    public function testLoginWithValidCredentials()
    public function testLoginWithInvalidCredentials()
    public function testAccessProtectedEndpoint()
    public function testTokenExpiration()
}
```

### API Testing

**Tools**: Postman/Insomnia collections

**Test Scenarios**:
- All CRUD operations for each resource
- Authentication and authorization
- Error handling and validation
- File upload and download
- Payment processing
- Wallet operations

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Role-based access control
- [ ] Wallet top-up and withdrawal
- [ ] Application submission and approval
- [ ] Certificate generation
- [ ] Product ordering
- [ ] Payment verification
- [ ] File uploads
- [ ] Notification delivery
- [ ] Analytics and reporting



## API Endpoint Design

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: Authenticate user and return JWT token

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "RETAILER"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "RETAILER"
    }
  }
}
```

#### POST /api/auth/register
**Purpose**: Register new retailer (pending approval)

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "SecurePass123",
  "address": "123 Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "payment_screenshot_url": "/public/uploads/payment.jpg"
}
```

#### POST /api/auth/change-password
**Purpose**: Change user password

**Request**:
```json
{
  "current_password": "OldPass123",
  "new_password": "NewPass456"
}
```

### User Management Endpoints

#### GET /api/users
**Auth**: Admin only
**Query Params**: role, search, page, limit

#### POST /api/users
**Auth**: Admin only
**Purpose**: Create new user (Employee/Retailer)

#### GET /api/users/{id}
**Auth**: Required
**Purpose**: Get user details

#### PUT /api/users/{id}
**Auth**: Required (own profile or admin)
**Purpose**: Update user profile

#### DELETE /api/users/{id}
**Auth**: Admin only
**Purpose**: Deactivate user

### Wallet Endpoints

#### GET /api/wallet
**Auth**: Required
**Purpose**: Get current wallet balance

#### POST /api/wallet/payment-verification
**Auth**: Required
**Purpose**: Submit payment proof for wallet top-up

**Request**:
```json
{
  "amount": 1000.00,
  "payment_method": "UPI",
  "transaction_id": "TXN123456",
  "screenshot_url": "/public/uploads/payment.jpg"
}
```

#### POST /api/wallet/withdraw
**Auth**: Required
**Purpose**: Request wallet withdrawal

**Request**:
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

#### POST /api/wallet/create-order
**Auth**: Required
**Purpose**: Create Razorpay order for wallet top-up

#### POST /api/wallet/verify-payment
**Auth**: Required
**Purpose**: Verify Razorpay payment signature

### Wallet Requests Endpoints

#### GET /api/wallet-requests
**Auth**: Required
**Query Params**: status, type, user_id (admin only)

#### POST /api/wallet-requests
**Auth**: Required
**Purpose**: Create wallet request (top-up/withdrawal)

#### PUT /api/wallet-requests
**Auth**: Admin/Employee
**Purpose**: Approve or reject wallet request

**Request**:
```json
{
  "request_id": "uuid",
  "action": "approve",
  "reject_reason": null
}
```

### Schemes Endpoints

#### GET /api/schemes
**Auth**: Required
**Query Params**: category, is_free, search

#### POST /api/schemes
**Auth**: Admin only
**Purpose**: Create new scheme

#### GET /api/schemes/{id}
**Auth**: Required
**Purpose**: Get scheme details

#### PUT /api/schemes/{id}
**Auth**: Admin only
**Purpose**: Update scheme

#### DELETE /api/schemes/{id}
**Auth**: Admin only
**Purpose**: Deactivate scheme

### Applications Endpoints

#### GET /api/applications
**Auth**: Required
**Query Params**: status, scheme_id, from_date, to_date

#### POST /api/applications
**Auth**: Retailer
**Purpose**: Submit new application

**Request**:
```json
{
  "scheme_id": "uuid",
  "customer_name": "Customer Name",
  "customer_phone": "1234567890",
  "customer_email": "customer@example.com",
  "customer_address": "Customer Address",
  "form_data": {
    "field1": "value1",
    "field2": "value2"
  },
  "documents": [
    "/public/uploads/doc1.pdf",
    "/public/uploads/doc2.jpg"
  ],
  "dynamic_field_documents": {
    "field1": ["/public/uploads/field1_doc.pdf"]
  }
}
```

#### GET /api/applications/{id}
**Auth**: Required
**Purpose**: Get application details

#### PATCH /api/applications/{id}
**Auth**: Admin/Employee
**Purpose**: Update application status

**Request**:
```json
{
  "status": "APPROVED",
  "notes": "Application approved"
}
```

### Products Endpoints

#### GET /api/products
**Auth**: Required
**Query Params**: category, search

#### GET /api/products/{id}
**Auth**: Required

#### POST /api/products
**Auth**: Admin only

#### PUT /api/products/{id}
**Auth**: Admin only

### Orders Endpoints

#### GET /api/orders
**Auth**: Required
**Query Params**: status

#### POST /api/orders
**Auth**: Required
**Purpose**: Place new order

**Request**:
```json
{
  "product_id": "uuid",
  "quantity": 1,
  "payment_method": "WALLET",
  "customer_details": {
    "name": "John Doe",
    "phone": "1234567890",
    "address": "Delivery Address"
  }
}
```

#### GET /api/orders/{id}
**Auth**: Required

#### PATCH /api/orders/{id}
**Auth**: Admin/Employee
**Purpose**: Update order status

### Certificates Endpoints

#### GET /api/certificates
**Auth**: Required

#### POST /api/certificates/generate
**Auth**: Admin/Employee
**Purpose**: Generate certificate for application

#### GET /api/certificates/employee
**Auth**: Employee
**Purpose**: Get employee certificate

#### GET /api/certificates/retailer
**Auth**: Retailer
**Purpose**: Get retailer certificate

#### GET /api/certificates/download/{id}
**Auth**: Required
**Purpose**: Download certificate PDF

### File Upload Endpoint

#### POST /api/upload
**Auth**: Required
**Content-Type**: multipart/form-data
**Purpose**: Upload files (images, PDFs)

**Request**:
```
file: [binary data]
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "/public/uploads/filename_timestamp.jpg",
    "filename": "filename_timestamp.jpg",
    "size": 102400,
    "mime_type": "image/jpeg"
  }
}
```

### Transactions Endpoints

#### GET /api/transactions
**Auth**: Required
**Query Params**: type, status, from_date, to_date, page, limit

#### GET /api/transactions/commission
**Auth**: Retailer
**Purpose**: Get commission earnings

### Notifications Endpoints

#### GET /api/notifications
**Auth**: Required

#### POST /api/notifications
**Auth**: Admin
**Purpose**: Create notification

#### PATCH /api/notifications/{id}
**Auth**: Required
**Purpose**: Mark notification as read

### Advertisements Endpoints

#### GET /api/advertisements
**Auth**: Required
**Purpose**: Get active dashboard advertisements

#### GET /api/login-advertisements
**Auth**: Public
**Purpose**: Get login page advertisements

#### POST /api/advertisements/click/{id}
**Auth**: Required
**Purpose**: Track advertisement click

### Training Videos Endpoints

#### GET /api/training-videos
**Auth**: Required
**Query Params**: category, level

#### POST /api/training-videos
**Auth**: Admin

### Queries (Support) Endpoints

#### GET /api/queries
**Auth**: Required

#### POST /api/queries
**Auth**: Required
**Purpose**: Submit support query

#### PATCH /api/queries/{id}
**Auth**: Admin/Employee
**Purpose**: Respond to query

### Receipts Endpoints

#### GET /api/receipts
**Auth**: Required

#### GET /api/receipts/{id}
**Auth**: Required

### Refunds Endpoints

#### GET /api/refunds
**Auth**: Required

#### POST /api/refunds
**Auth**: Retailer
**Purpose**: Request refund

#### PATCH /api/refunds/{id}
**Auth**: Admin
**Purpose**: Process refund request

### Analytics Endpoints

#### GET /api/admin/analytics/dashboard
**Auth**: Admin
**Purpose**: Get dashboard statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "total_retailers": 100,
    "total_employees": 10,
    "active_applications": 25,
    "pending_wallet_requests": 5,
    "total_revenue": 50000.00,
    "monthly_revenue": 10000.00
  }
}
```

#### GET /api/admin/analytics/applications
**Auth**: Admin
**Query Params**: from_date, to_date

#### GET /api/admin/analytics/free-services
**Auth**: Admin
**Purpose**: Get free service usage analytics



## Security Design

### JWT Authentication

**Token Structure**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "RETAILER",
    "iat": 1234567890,
    "exp": 1234654290
  },
  "signature": "..."
}
```

**Token Lifecycle**:
1. User logs in with credentials
2. Server validates credentials against database
3. Server generates JWT with user info and 24-hour expiration
4. Client stores token (localStorage/sessionStorage)
5. Client includes token in Authorization header: `Bearer {token}`
6. Server validates token on each request
7. Token expires after 24 hours, requiring re-login

**Security Measures**:
- Tokens signed with secret key from environment
- Short expiration time (24 hours)
- No sensitive data in payload
- HTTPS-only in production
- Token validation on every protected route

### Password Security

**Hashing Algorithm**: bcrypt with cost factor 12

**Implementation**:
```php
// Hashing
$hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Verification
$isValid = password_verify($inputPassword, $hashedPassword);
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### SQL Injection Prevention

**Strategy**: Use PDO prepared statements exclusively

**Example**:
```php
$stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();
```

**Rules**:
- Never concatenate user input into SQL queries
- Always use named or positional parameters
- Validate and sanitize all inputs before database operations

### File Upload Security

**Validation Rules**:
- Maximum file size: 10MB
- Allowed extensions: pdf, jpg, jpeg, png, webp
- MIME type verification
- Filename sanitization
- Unique filename generation

**Implementation**:
```php
class FileUploadService {
    private const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    private const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    
    public function upload(array $file): array {
        // Validate size
        if ($file['size'] > self::MAX_SIZE) {
            throw new ValidationException('File size exceeds 10MB limit');
        }
        
        // Validate MIME type
        if (!in_array($file['type'], self::ALLOWED_TYPES)) {
            throw new ValidationException('Invalid file type');
        }
        
        // Validate extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            throw new ValidationException('Invalid file extension');
        }
        
        // Generate unique filename
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $uploadPath = __DIR__ . '/../../public/uploads/' . $filename;
        
        // Move file
        if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
            throw new Exception('Failed to upload file');
        }
        
        return [
            'url' => '/public/uploads/' . $filename,
            'filename' => $filename,
            'size' => $file['size'],
            'mime_type' => $file['type']
        ];
    }
}
```

### CORS Configuration

**Allowed Origins**: Configure in .env file

**Headers**:
```php
header('Access-Control-Allow-Origin: ' . $_ENV['FRONTEND_URL']);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
```

**Preflight Handling**:
```php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
```

### Rate Limiting

**Strategy**: Track requests per IP address

**Limits**:
- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- File upload: 10 requests per minute

**Implementation**:
```php
class RateLimiter {
    private const CACHE_PREFIX = 'rate_limit:';
    
    public function check(string $key, int $limit, int $window): bool {
        $cacheKey = self::CACHE_PREFIX . $key;
        $current = apcu_fetch($cacheKey) ?: 0;
        
        if ($current >= $limit) {
            return false;
        }
        
        apcu_store($cacheKey, $current + 1, $window);
        return true;
    }
}
```

## Database Design Considerations

### Connection Pooling

**Strategy**: Use persistent PDO connections

```php
$options = [
    PDO::ATTR_PERSISTENT => true,
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

$pdo = new PDO($dsn, $username, $password, $options);
```

### Transaction Management

**Pattern**: Use try-catch with rollback

```php
try {
    $db->beginTransaction();
    
    // Multiple database operations
    $wallet->deductBalance($amount);
    $application->create($data);
    $transaction->create($transactionData);
    
    $db->commit();
} catch (Exception $e) {
    $db->rollback();
    throw $e;
}
```

### Query Optimization

**Strategies**:
- Use indexes on frequently queried columns (email, phone, status, created_at)
- Limit result sets with pagination
- Use SELECT with specific columns instead of SELECT *
- Implement query result caching for static data
- Use EXPLAIN to analyze slow queries

### JSON Column Handling

**Storage**: Use JSON columns for flexible data (form_data, documents, metadata)

**Querying**:
```php
// MySQL JSON functions
$stmt = $db->prepare("
    SELECT * FROM applications 
    WHERE JSON_EXTRACT(form_data, '$.field_name') = :value
");
```

**PHP Handling**:
```php
// Encoding
$jsonData = json_encode($data, JSON_UNESCAPED_UNICODE);

// Decoding
$data = json_decode($jsonColumn, true);
```

## External API Integration

### Razorpay Payment Gateway

**Configuration**:
```php
class RazorpayService {
    private string $keyId;
    private string $keySecret;
    
    public function __construct() {
        $this->keyId = $_ENV['RAZORPAY_KEY_ID'];
        $this->keySecret = $_ENV['RAZORPAY_KEY_SECRET'];
    }
    
    public function createOrder(float $amount): array {
        $api = new \Razorpay\Api\Api($this->keyId, $this->keySecret);
        
        $order = $api->order->create([
            'amount' => $amount * 100, // Convert to paise
            'currency' => 'INR',
            'receipt' => 'order_' . time(),
        ]);
        
        return [
            'orderId' => $order->id,
            'amount' => $order->amount,
            'currency' => $order->currency,
            'key' => $this->keyId
        ];
    }
    
    public function verifySignature(array $data): bool {
        $expectedSignature = hash_hmac(
            'sha256',
            $data['razorpay_order_id'] . '|' . $data['razorpay_payment_id'],
            $this->keySecret
        );
        
        return hash_equals($expectedSignature, $data['razorpay_signature']);
    }
}
```

### WhatsApp Notification Integration (Future)

**Placeholder for WhatsApp Business API integration**:
```php
class WhatsAppService {
    public function sendNotification(string $phone, string $message): bool {
        // Implementation for WhatsApp Business API
        // To be added based on requirements
        return true;
    }
}
```

## Performance Optimization

### Caching Strategy

**Tools**: APCu (PHP opcode cache) or Redis

**Cache Targets**:
- Active schemes list (TTL: 1 hour)
- User session data (TTL: 24 hours)
- Static configuration (TTL: 24 hours)
- Product catalog (TTL: 1 hour)

**Implementation**:
```php
class CacheService {
    public function get(string $key) {
        return apcu_fetch($key);
    }
    
    public function set(string $key, $value, int $ttl = 3600): bool {
        return apcu_store($key, $value, $ttl);
    }
    
    public function delete(string $key): bool {
        return apcu_delete($key);
    }
}
```

### Database Query Optimization

**Pagination**:
```php
$page = $_GET['page'] ?? 1;
$limit = $_GET['limit'] ?? 10;
$offset = ($page - 1) * $limit;

$stmt = $db->prepare("
    SELECT * FROM applications 
    WHERE user_id = :user_id 
    ORDER BY created_at DESC 
    LIMIT :limit OFFSET :offset
");
$stmt->bindValue(':user_id', $userId, PDO::PARAM_STR);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
```

### Response Compression

**Enable gzip compression**:
```php
if (!ob_start('ob_gzhandler')) {
    ob_start();
}
```

## Deployment Configuration

### Environment Variables

**.env file structure**:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vignaharta_db
DB_USER=root
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vighnahartaonlineservice.in
FRONTEND_URL=https://vighnahartaonlineservice.in

# File Upload
UPLOAD_PATH=public/uploads
MAX_UPLOAD_SIZE=10485760

# CORS
ALLOWED_ORIGINS=https://vighnahartaonlineservice.in
```

### .htaccess Configuration

**For Apache servers**:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### PHP Configuration

**php.ini settings**:
```ini
upload_max_filesize = 10M
post_max_size = 10M
memory_limit = 256M
max_execution_time = 30
display_errors = Off
log_errors = On
error_log = /path/to/php-error.log
```

## Migration Strategy

### Phase 1: Setup and Core Infrastructure
- Set up PHP project structure
- Configure database connection
- Implement JWT authentication
- Create base classes (Controller, Model, Middleware)

### Phase 2: Core API Endpoints
- Authentication endpoints
- User management
- Wallet operations
- Transactions

### Phase 3: Business Logic
- Schemes management
- Applications processing
- Certificate generation
- Commission calculation

### Phase 4: Additional Features
- Products and orders
- Payment integration
- File uploads
- Notifications

### Phase 5: Admin Features
- Analytics and reporting
- Advertisement management
- Training videos
- User approvals

### Phase 6: Testing and Deployment
- Unit and integration testing
- API documentation
- Performance testing
- Production deployment

## Monitoring and Logging

### Error Logging

**Strategy**: Log all errors to file and optionally to database

```php
class Logger {
    public function error(string $message, array $context = []): void {
        $logMessage = sprintf(
            "[%s] ERROR: %s | Context: %s\n",
            date('Y-m-d H:i:s'),
            $message,
            json_encode($context)
        );
        
        error_log($logMessage, 3, __DIR__ . '/../../logs/error.log');
    }
    
    public function info(string $message, array $context = []): void {
        $logMessage = sprintf(
            "[%s] INFO: %s | Context: %s\n",
            date('Y-m-d H:i:s'),
            $message,
            json_encode($context)
        );
        
        error_log($logMessage, 3, __DIR__ . '/../../logs/app.log');
    }
}
```

### Request Logging

**Log all API requests**:
```php
$logger->info('API Request', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_SERVER['REQUEST_URI'],
    'user_id' => $user['id'] ?? 'anonymous',
    'ip' => $_SERVER['REMOTE_ADDR']
]);
```

### Performance Monitoring

**Track response times**:
```php
$startTime = microtime(true);

// Process request

$endTime = microtime(true);
$duration = ($endTime - $startTime) * 1000; // milliseconds

if ($duration > 1000) {
    $logger->warning('Slow request', [
        'path' => $_SERVER['REQUEST_URI'],
        'duration' => $duration
    ]);
}
```

## Documentation

### API Documentation Format

**Tool**: Postman Collection + Markdown

**Structure**:
- Endpoint URL and method
- Authentication requirements
- Request parameters and body
- Response format and examples
- Error responses
- Usage examples

### Code Documentation

**PHPDoc standards**:
```php
/**
 * Create a new application for a scheme
 *
 * @param array $data Application data including scheme_id, customer details, and form data
 * @return array Created application with ID and status
 * @throws ValidationException If required fields are missing
 * @throws InsufficientBalanceException If wallet balance is insufficient
 */
public function createApplication(array $data): array {
    // Implementation
}
```

### README Documentation

**Sections**:
- Installation instructions
- Environment configuration
- API endpoint list
- Authentication guide
- Development setup
- Deployment guide
- Troubleshooting

