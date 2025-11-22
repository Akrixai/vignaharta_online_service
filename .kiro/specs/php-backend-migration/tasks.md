# Implementation Plan

- [ ] 1. Project Setup and Core Infrastructure





  - Initialize PHP project with composer
  - Create directory structure (src/, public/, vendor/)
  - Install dependencies (JWT library, Razorpay SDK, dotenv)
  - Create .env.example file with all required variables
  - Set up .htaccess for URL rewriting
  - _Requirements: 18.1, 19.1, 19.2_

- [x] 1.1 Create Database Connection Class


  - Implement Database.php with PDO singleton pattern
  - Add connection pooling configuration
  - Implement transaction management methods (beginTransaction, commit, rollback)
  - Add query execution method with prepared statements
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 1.2 Create Configuration Management


  - Implement Config.php to load environment variables
  - Add configuration getters for database, JWT, Razorpay, file upload settings
  - Validate required environment variables on initialization
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 1.3 Create Router System


  - Implement Router.php with route registration and matching
  - Add support for dynamic route parameters (e.g., /api/users/{id})
  - Implement HTTP method matching (GET, POST, PUT, PATCH, DELETE)
  - Add middleware execution pipeline
  - Create Routes.php to define all API routes
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 1.4 Create Entry Point


  - Implement public/index.php as main entry point
  - Load environment variables and configuration
  - Initialize router and register routes
  - Add global error handler
  - Implement request/response handling
  - _Requirements: 20.1, 20.2_

- [x] 2. Utility Classes and Helpers





  - Create utility classes for common operations
  - _Requirements: 1.1, 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 2.1 Create JWT Helper


  - Implement JWTHelper.php for token generation and validation
  - Add generateToken method with user payload
  - Add validateToken method with signature verification
  - Implement token expiration checking
  - Add extractPayload method
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 Create Response Helper


  - Implement Response.php for consistent JSON responses
  - Add success method for successful responses
  - Add error method for error responses
  - Add pagination method for paginated data
  - Implement proper HTTP status code setting
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 2.3 Create Validator Class


  - Implement Validator.php for input validation
  - Add validation rules (required, email, phone, min, max, numeric)
  - Implement validate method that returns errors array
  - Add custom validation messages
  - _Requirements: 16.2_

- [x] 2.4 Create File Helper


  - Implement FileHelper.php for file operations
  - Add sanitizeFilename method
  - Add generateUniqueFilename method
  - Add getFileExtension and getMimeType methods
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 3. Exception Classes





  - Create custom exception hierarchy
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 3.1 Create Base API Exception


  - Implement ApiException.php extending Exception
  - Add statusCode and errorCode properties
  - Implement toArray method for JSON serialization
  - _Requirements: 16.1_

- [x] 3.2 Create Specific Exceptions


  - Implement AuthException.php for authentication errors
  - Implement ValidationException.php for validation errors
  - Implement NotFoundException.php for resource not found
  - Implement DatabaseException.php for database errors
  - Implement InsufficientBalanceException.php for wallet errors
  - _Requirements: 16.2, 16.3, 16.4, 16.5_

- [ ] 4. Middleware Implementation





  - Create middleware classes for request processing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 17.1, 17.2, 17.3_

- [x] 4.1 Create CORS Middleware


  - Implement CorsMiddleware.php
  - Add CORS headers (Access-Control-Allow-Origin, Methods, Headers)
  - Handle OPTIONS preflight requests
  - Load allowed origins from configuration
  - _Requirements: 17.1, 17.2, 17.3_

- [x] 4.2 Create Authentication Middleware


  - Implement AuthMiddleware.php
  - Extract JWT token from Authorization header
  - Validate token using JWTHelper
  - Add user information to request context
  - Handle public routes that don't require authentication
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4.3 Create Role-Based Access Middleware


  - Implement RoleMiddleware.php
  - Check user role against required roles
  - Return 403 Forbidden if insufficient permissions
  - _Requirements: 1.4_

- [ ] 5. Base Controller and Model Classes





  - Create abstract base classes for controllers and models
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.1 Create Base Controller


  - Implement BaseController.php
  - Add database and user properties
  - Implement json, error, and pagination response methods
  - Add requireAuth and requireRole helper methods
  - Add validate method using Validator class
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.2 Create Base Model


  - Implement Model.php abstract class
  - Add table, primaryKey, and fillable properties
  - Implement find, findBy, all, create, update, delete methods
  - Add query builder support for complex queries
  - Implement relationship loading methods
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Authentication System




  - Implement authentication endpoints and services
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.1 Create Auth Service


  - Implement AuthService.php
  - Add login method with credential validation
  - Add password verification using password_verify
  - Add JWT token generation on successful login
  - Implement password change functionality
  - _Requirements: 1.1, 1.5_

- [x] 6.2 Create Auth Controller


  - Implement AuthController.php extending BaseController
  - Add POST /api/auth/login endpoint
  - Add POST /api/auth/register endpoint for retailer registration
  - Add POST /api/auth/change-password endpoint
  - Validate input data and return appropriate responses
  - _Requirements: 1.1, 1.5_

- [ ] 7. User Management Module




  - Implement user CRUD operations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7.1 Create User Model


  - Implement User.php extending Model
  - Define fillable fields
  - Add wallet relationship method
  - Add applications relationship method
  - Add verifyPassword method
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7.2 Create Users Controller


  - Implement UsersController.php
  - Add GET /api/users endpoint with pagination and filters
  - Add POST /api/users endpoint for creating users
  - Add GET /api/users/{id} endpoint
  - Add PUT /api/users/{id} endpoint
  - Add DELETE /api/users/{id} endpoint (soft delete)
  - Implement role-based access control
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [-] 8. Wallet Management Module


  - Implement wallet operations and balance management
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [x] 8.1 Create Wallet Model

  - Implement Wallet.php extending Model
  - Add addBalance method with validation
  - Add deductBalance method with insufficient balance check
  - Add getBalance method
  - Add transactions relationship method
  - _Requirements: 3.1, 3.4, 3.5_

- [x] 8.2 Create Transaction Model


  - Implement Transaction.php extending Model
  - Define fillable fields
  - Add user and wallet relationship methods
  - _Requirements: 3.4, 3.5_

- [x] 8.3 Create Wallet Service


  - Implement WalletService.php
  - Add createWallet method for new users
  - Add processTopup method with transaction creation
  - Add processWithdrawal method with balance validation
  - Implement transaction management for atomic operations
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [-] 8.4 Create Wallet Controller




  - Implement WalletController.php
  - Add GET /api/wallet endpoint
  - Add POST /api/wallet/payment-verification endpoint
  - Add POST /api/wallet/withdraw endpoint
  - Add POST /api/wallet/create-order endpoint (Razorpay)
  - Add POST /api/wallet/verify-payment endpoint (Razorpay)
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 9. Wallet Requests Module
  - Implement wallet request approval system
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 9.1 Create WalletRequest Model
  - Implement WalletRequest.php extending Model
  - Define fillable fields
  - Add user relationship method
  - Add approve and reject methods
  - _Requirements: 3.2, 3.3_

- [ ] 9.2 Create Wallet Requests Controller
  - Implement WalletRequestsController.php
  - Add GET /api/wallet-requests endpoint with filters
  - Add POST /api/wallet-requests endpoint
  - Add PUT /api/wallet-requests endpoint for approval/rejection
  - Implement wallet balance update on approval
  - Create transaction record on approval
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 10. Transactions Module
  - Implement transaction history and commission tracking
  - _Requirements: 3.4, 3.5_

- [ ] 10.1 Create Transactions Controller
  - Implement TransactionsController.php
  - Add GET /api/transactions endpoint with filters and pagination
  - Add POST /api/transactions endpoint
  - Add GET /api/transactions/commission endpoint for retailers
  - Implement date range filtering
  - _Requirements: 3.4, 3.5_

- [ ] 11. Schemes Management Module
  - Implement scheme CRUD operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11.1 Create Scheme Model
  - Implement Scheme.php extending Model
  - Define fillable fields including JSON columns
  - Add applications relationship method
  - Add isActive method
  - Add calculateCommission method
  - _Requirements: 4.1, 4.3, 4.5_

- [ ] 11.2 Create Schemes Controller
  - Implement SchemesController.php
  - Add GET /api/schemes endpoint with filters
  - Add POST /api/schemes endpoint (admin only)
  - Add GET /api/schemes/{id} endpoint
  - Add PUT /api/schemes/{id} endpoint (admin only)
  - Add DELETE /api/schemes/{id} endpoint (admin only)
  - Handle JSON fields (dynamic_fields, required_documents)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12. Applications Processing Module
  - Implement application submission and approval workflow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12.1 Create Application Model
  - Implement Application.php extending Model
  - Define fillable fields including JSON columns
  - Add scheme and user relationship methods
  - Add approve method with wallet deduction and commission calculation
  - Add reject method with refund logic
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 12.2 Create Application Service
  - Implement ApplicationService.php
  - Add submitApplication method with validation
  - Add approveApplication method with transaction management
  - Add rejectApplication method
  - Implement commission calculation and wallet operations
  - Create receipt on approval
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 12.3 Create Applications Controller
  - Implement ApplicationsController.php
  - Add GET /api/applications endpoint with filters
  - Add POST /api/applications endpoint (retailer)
  - Add GET /api/applications/{id} endpoint
  - Add PATCH /api/applications/{id} endpoint (admin/employee)
  - Handle file uploads for documents and dynamic field documents
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13. File Upload Module
  - Implement secure file upload functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13.1 Create File Upload Service
  - Implement FileUploadService.php
  - Add upload method with validation
  - Validate file size (max 10MB)
  - Validate file type and MIME type
  - Sanitize and generate unique filenames
  - Move uploaded files to public/uploads directory
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13.2 Create Upload Controller
  - Implement UploadController.php
  - Add POST /api/upload endpoint
  - Handle multipart/form-data requests
  - Return file URL and metadata
  - Implement error handling for upload failures
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 14. Certificates Module
  - Implement certificate generation and management
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 14.1 Create Certificate Models
  - Implement Certificate.php extending Model
  - Implement EmployeeCertificate.php extending Model
  - Implement RetailerCertificate.php extending Model
  - Add application and user relationship methods
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14.2 Create Certificate Service
  - Implement CertificateService.php
  - Add generateCertificate method with unique certificate number
  - Add generateEmployeeCertificate method
  - Add generateRetailerCertificate method
  - Implement digital signature generation
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 14.3 Create Certificates Controller
  - Implement CertificatesController.php
  - Add GET /api/certificates endpoint
  - Add POST /api/certificates/generate endpoint
  - Add GET /api/certificates/employee endpoint
  - Add GET /api/certificates/retailer endpoint
  - Add GET /api/certificates/download/{id} endpoint
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15. Products and Orders Module
  - Implement product catalog and order management
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15.1 Create Product and Order Models
  - Implement Product.php extending Model
  - Implement Order.php extending Model
  - Add product and user relationship methods
  - Add stock management methods
  - _Requirements: 8.1, 8.2_

- [ ] 15.2 Create Products Controller
  - Implement ProductsController.php
  - Add GET /api/products endpoint with filters
  - Add GET /api/products/{id} endpoint
  - Add POST /api/products endpoint (admin only)
  - Add PUT /api/products/{id} endpoint (admin only)
  - _Requirements: 8.1_

- [ ] 15.3 Create Orders Controller
  - Implement OrdersController.php
  - Add GET /api/orders endpoint with filters
  - Add POST /api/orders endpoint with wallet payment
  - Add GET /api/orders/{id} endpoint
  - Add PATCH /api/orders/{id} endpoint (admin/employee)
  - Implement stock validation and wallet deduction
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Payment Integration Module
  - Implement Razorpay payment gateway integration
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 16.1 Create Payment Service
  - Implement PaymentService.php
  - Integrate Razorpay SDK
  - Add createOrder method
  - Add verifySignature method using HMAC SHA256
  - Add processPayment method with wallet credit
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 16.2 Create Payment Verification Model
  - Implement PaymentVerification.php extending Model
  - Define fillable fields
  - Add user relationship method
  - _Requirements: 9.4, 9.5_

- [ ] 16.3 Create Payment Controller
  - Implement PaymentController.php
  - Add POST /api/payment/create-order endpoint
  - Add POST /api/payment/verify endpoint
  - Add GET /api/payment/status/{id} endpoint
  - Handle payment verification approval workflow
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 17. Notifications Module
  - Implement notification system
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 17.1 Create Notification Model and Service
  - Implement Notification.php extending Model
  - Implement NotificationService.php
  - Add createNotification method with target users/roles
  - Add sendToUser and sendToRole methods
  - _Requirements: 10.1_

- [ ] 17.2 Create Notifications Controller
  - Implement NotificationsController.php
  - Add GET /api/notifications endpoint
  - Add POST /api/notifications endpoint (admin)
  - Add PATCH /api/notifications/{id} endpoint (mark as read)
  - Filter notifications by target_users JSON array
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 18. Support Queries Module
  - Implement support ticket system
  - _Requirements: 10.4, 10.5_

- [ ] 18.1 Create Query Model
  - Implement Query.php extending Model (table: queries)
  - Define fillable fields
  - Add user relationship method
  - _Requirements: 10.4_

- [ ] 18.2 Create Queries Controller
  - Implement QueriesController.php
  - Add GET /api/queries endpoint
  - Add POST /api/queries endpoint
  - Add PATCH /api/queries/{id} endpoint (admin response)
  - _Requirements: 10.4, 10.5_

- [ ] 19. Advertisements Module
  - Implement advertisement management
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 19.1 Create Advertisement Models
  - Implement Advertisement.php extending Model
  - Implement LoginAdvertisement.php extending Model
  - Add date range filtering methods
  - _Requirements: 11.1, 11.5_

- [ ] 19.2 Create Advertisements Controller
  - Implement AdvertisementsController.php
  - Add GET /api/advertisements endpoint with date filtering
  - Add GET /api/login-advertisements endpoint
  - Add POST /api/advertisements endpoint (admin)
  - Add POST /api/advertisements/click/{id} endpoint
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 20. Training Videos Module
  - Implement training video management
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 20.1 Create TrainingVideo Model
  - Implement TrainingVideo.php extending Model
  - Define fillable fields
  - Add incrementViewCount method
  - _Requirements: 12.2_

- [ ] 20.2 Create Training Videos Controller
  - Implement TrainingVideosController.php
  - Add GET /api/training-videos endpoint with filters
  - Add POST /api/training-videos endpoint (admin)
  - Implement view count increment on video access
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 21. Refunds Module
  - Implement refund request and processing
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 21.1 Create Refund Model
  - Implement Refund.php extending Model
  - Define fillable fields
  - Add user and application relationship methods
  - _Requirements: 13.1, 13.5_

- [ ] 21.2 Create Refunds Controller
  - Implement RefundsController.php
  - Add GET /api/refunds endpoint
  - Add POST /api/refunds endpoint (retailer)
  - Add PATCH /api/refunds/{id} endpoint (admin approval/rejection)
  - Implement wallet credit on approval
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 22. Receipts Module
  - Implement receipt generation and retrieval
  - _Requirements: 5.2_

- [ ] 22.1 Create Receipt Model
  - Implement Receipt.php extending Model
  - Define fillable fields
  - Add application, retailer, and employee relationship methods
  - _Requirements: 5.2_

- [ ] 22.2 Create Receipts Controller
  - Implement ReceiptsController.php
  - Add GET /api/receipts endpoint
  - Add GET /api/receipts/{id} endpoint
  - Generate receipt on application approval
  - _Requirements: 5.2_

- [ ] 23. Branches and Registration Management
  - Implement branch management and registration approval
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 23.1 Create Branch and Registration Models
  - Implement Branch.php extending Model
  - Implement PendingRegistration.php extending Model
  - Implement RegistrationFee.php extending Model
  - _Requirements: 14.1, 14.2, 14.5_

- [ ] 23.2 Create Branches Controller
  - Implement BranchesController.php
  - Add GET /api/branches endpoint
  - Add POST /api/branches endpoint (admin)
  - _Requirements: 14.1_

- [ ] 23.3 Create Registrations Controller
  - Implement RegistrationsController.php
  - Add GET /api/admin/pending-registrations endpoint
  - Add POST /api/admin/pending-registrations/approve endpoint
  - Add POST /api/admin/pending-registrations/reject endpoint
  - Implement user creation, wallet creation, and certificate generation on approval
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [ ] 24. Analytics and Reporting Module
  - Implement analytics endpoints for admin dashboard
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 24.1 Create Analytics Service
  - Implement AnalyticsService.php
  - Add getDashboardStats method
  - Add getApplicationAnalytics method with date range
  - Add getFreeServiceAnalytics method
  - Add getCommissionReport method
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 24.2 Create Analytics Controller
  - Implement AnalyticsController.php
  - Add GET /api/admin/analytics/dashboard endpoint
  - Add GET /api/admin/analytics/applications endpoint
  - Add GET /api/admin/analytics/free-services endpoint
  - Add GET /api/admin/analytics/commission endpoint
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 25. Documents Management Module
  - Implement document upload and management for employees
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 25.1 Create Document Models
  - Implement Document.php extending Model
  - Implement EmployeeDocument.php extending Model
  - Add user relationship methods
  - _Requirements: 6.1_

- [ ] 25.2 Create Documents Controller
  - Implement DocumentsController.php
  - Add GET /api/documents endpoint
  - Add POST /api/documents endpoint
  - Add GET /api/documents/{id} endpoint
  - Add PATCH /api/documents/{id} endpoint (admin review)
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 26. Security Enhancements
  - Implement additional security measures
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 26.1 Implement Input Sanitization
  - Add sanitization methods in Validator class
  - Sanitize all user inputs before database operations
  - Implement XSS prevention
  - _Requirements: 17.4, 17.5_

- [ ] 26.2 Add Security Headers
  - Implement security headers in CORS middleware
  - Add X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
  - Configure Content-Security-Policy
  - _Requirements: 17.2_

- [ ]* 26.3 Implement Rate Limiting
  - Create RateLimiter class using APCu
  - Add rate limiting to authentication endpoints
  - Add rate limiting to file upload endpoints
  - _Requirements: 17.1_

- [ ] 27. API Documentation
  - Create comprehensive API documentation
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 27.1 Create API Documentation File
  - Create comprehensive API_DOCUMENTATION.md
  - Document all endpoints with request/response examples
  - Include authentication requirements
  - Add error response examples
  - Document query parameters and filters
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 27.2 Create Postman Collection
  - Export Postman collection with all endpoints
  - Add example requests for each endpoint
  - Include environment variables
  - Add authentication setup
  - _Requirements: 16.1_

- [ ] 28. Testing and Validation
  - Test all API endpoints and functionality
  - _Requirements: All requirements_

- [ ] 28.1 Test Authentication Flow
  - Test login with valid credentials
  - Test login with invalid credentials
  - Test JWT token validation
  - Test token expiration
  - Test role-based access control
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 28.2 Test User Management
  - Test user creation by admin
  - Test user profile updates
  - Test user listing with filters
  - Test user deactivation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 28.3 Test Wallet Operations
  - Test wallet balance retrieval
  - Test wallet top-up request
  - Test wallet withdrawal request
  - Test wallet request approval
  - Test transaction creation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 28.4 Test Application Workflow
  - Test application submission
  - Test application approval with wallet deduction
  - Test application rejection with refund
  - Test commission calculation
  - Test receipt generation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 28.5 Test File Upload
  - Test valid file upload
  - Test file size validation
  - Test file type validation
  - Test filename sanitization
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 28.6 Test Payment Integration
  - Test Razorpay order creation
  - Test payment signature verification
  - Test wallet credit on successful payment
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 29. Deployment Preparation
  - Prepare for production deployment
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 29.1 Create Production Configuration
  - Create production .env file
  - Configure database credentials
  - Set JWT secret
  - Configure Razorpay production keys
  - Set APP_ENV to production and APP_DEBUG to false
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 29.2 Configure Web Server
  - Create .htaccess file for Apache
  - Configure URL rewriting
  - Add security headers
  - Enable gzip compression
  - _Requirements: 17.2_

- [ ] 29.3 Set PHP Configuration
  - Configure upload_max_filesize and post_max_size
  - Set memory_limit and max_execution_time
  - Disable display_errors and enable log_errors
  - _Requirements: 6.3_

- [ ] 29.4 Create Deployment README
  - Document installation steps
  - Document environment configuration
  - Add troubleshooting guide
  - Include API endpoint reference
  - _Requirements: 16.1_

- [ ] 30. Final Integration and Testing
  - Integrate with frontend and perform end-to-end testing
  - _Requirements: All requirements_

- [ ] 30.1 Frontend Integration
  - Update frontend API base URL to PHP backend
  - Test all frontend pages with PHP backend
  - Verify authentication flow
  - Test file uploads from frontend
  - Verify all CRUD operations
  - _Requirements: All requirements_

- [ ] 30.2 Performance Testing
  - Test API response times
  - Verify database query performance
  - Test concurrent user handling
  - Monitor memory usage
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 30.3 Security Audit
  - Verify JWT token security
  - Test SQL injection prevention
  - Verify file upload security
  - Test CORS configuration
  - Verify password hashing
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
