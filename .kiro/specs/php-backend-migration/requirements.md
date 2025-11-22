# Requirements Document

## Introduction

This document outlines the requirements for migrating the Vignaharta Online Service backend from Next.js API routes to a standalone PHP REST API. The system currently uses Next.js with NextAuth.js for authentication and stores files in the public folder. The new PHP backend will maintain the same functionality while using the existing MySQL database hosted on cPanel/phpMyAdmin and continue storing files in the public folder structure.

## Glossary

- **PHP_API_System**: The new standalone PHP REST API backend that will replace Next.js API routes
- **MySQL_Database**: The existing MySQL database (vighnaha_mainvighnahrtadb) hosted on cPanel with phpMyAdmin
- **Authentication_Module**: JWT-based authentication system replacing NextAuth.js sessions
- **File_Storage_System**: File upload and management system using the public folder structure
- **API_Endpoint**: RESTful HTTP endpoint that handles specific business operations
- **Retailer**: User with RETAILER role who can apply for schemes and services
- **Employee**: User with EMPLOYEE role who can process applications
- **Admin**: User with ADMIN role who has full system access
- **Application**: Service/scheme application submitted by retailers
- **Wallet**: Digital wallet system for managing user balance
- **Scheme**: Government service/scheme offered through the platform
- **Commission**: Earnings paid to retailers for completed applications

## Requirements

### Requirement 1: Authentication and Authorization System

**User Story:** As a system user, I want to securely authenticate and access role-based features, so that my account and data remain protected

#### Acceptance Criteria

1. WHEN a user submits valid credentials to the login endpoint, THE PHP_API_System SHALL generate a JWT token containing user_id, email, and role
2. WHEN a user includes a valid JWT token in the Authorization header, THE PHP_API_System SHALL authenticate the request and extract user information
3. WHEN a user's JWT token expires, THE PHP_API_System SHALL return a 401 Unauthorized response with an appropriate error message
4. WHERE an endpoint requires specific role permissions, THE PHP_API_System SHALL verify the user's role from the JWT token before processing the request
5. WHEN a user requests password change with valid current password, THE PHP_API_System SHALL hash the new password using bcrypt and update the MySQL_Database

### Requirement 2: User Management API

**User Story:** As an admin, I want to manage user accounts through API endpoints, so that I can create, update, and monitor all system users

#### Acceptance Criteria

1. WHEN an admin requests the user list endpoint, THE PHP_API_System SHALL retrieve all users from the MySQL_Database with pagination support
2. WHEN an admin creates a new user with valid data, THE PHP_API_System SHALL hash the password, insert the record into the users table, and create an associated wallet record
3. WHEN a user updates their profile information, THE PHP_API_System SHALL validate the data and update the corresponding record in the MySQL_Database
4. WHERE search or filter parameters are provided, THE PHP_API_System SHALL apply SQL WHERE clauses to filter users by role, email, phone, or name
5. WHEN an admin requests to delete a user, THE PHP_API_System SHALL set is_active to FALSE instead of performing hard deletion

### Requirement 3: Wallet and Transaction Management

**User Story:** As a retailer, I want to manage my wallet balance and view transaction history, so that I can track my earnings and payments

#### Acceptance Criteria

1. WHEN a user requests their wallet balance, THE PHP_API_System SHALL retrieve the current balance from the wallets table in the MySQL_Database
2. WHEN a user submits a wallet top-up request with payment proof, THE PHP_API_System SHALL create a PENDING record in the wallet_requests table and store the screenshot in the File_Storage_System
3. WHEN an admin approves a wallet request, THE PHP_API_System SHALL update the wallet balance, create a DEPOSIT transaction, and update the request status to APPROVED
4. WHEN a user requests transaction history with date filters, THE PHP_API_System SHALL retrieve transactions from the MySQL_Database ordered by created_at descending
5. WHEN a commission is earned from an approved application, THE PHP_API_System SHALL create a COMMISSION transaction and update the wallet balance

### Requirement 4: Scheme and Service Management

**User Story:** As an admin, I want to manage schemes and services through API endpoints, so that I can add, update, and configure available services

#### Acceptance Criteria

1. WHEN a user requests the list of active schemes, THE PHP_API_System SHALL retrieve all schemes where is_active is TRUE from the MySQL_Database
2. WHEN an admin creates a new scheme with dynamic fields and required documents, THE PHP_API_System SHALL store the JSON configuration in the schemes table
3. WHEN a user requests scheme details by ID, THE PHP_API_System SHALL retrieve the complete scheme record including dynamic_fields and required_documents JSON data
4. WHERE a scheme has an external_url and is_free is TRUE, THE PHP_API_System SHALL return the external URL for client-side redirection
5. WHEN an admin updates scheme pricing or commission rates, THE PHP_API_System SHALL validate that price and commission_rate are non-negative before updating

### Requirement 5: Application Processing System

**User Story:** As a retailer, I want to submit service applications with documents, so that I can provide services to customers

#### Acceptance Criteria

1. WHEN a retailer submits an application with form data and documents, THE PHP_API_System SHALL validate required fields, store documents in the File_Storage_System, and create a PENDING application record
2. WHEN an employee approves an application, THE PHP_API_System SHALL update the status to APPROVED, deduct the amount from the retailer's wallet, create a receipt, and calculate commission
3. WHEN an application is rejected, THE PHP_API_System SHALL update the status to REJECTED, store the rejection reason, and refund the amount to the retailer's wallet if already deducted
4. WHEN a retailer requests their application history with status filters, THE PHP_API_System SHALL retrieve applications from the MySQL_Database with associated scheme information
5. WHERE dynamic field documents are uploaded, THE PHP_API_System SHALL store the file paths in the dynamic_field_documents JSON column with field mapping

### Requirement 6: File Upload and Management

**User Story:** As a user, I want to upload documents and images securely, so that I can submit required files for applications and verifications

#### Acceptance Criteria

1. WHEN a user uploads a file to the upload endpoint, THE PHP_API_System SHALL validate the file type, size, and extension before processing
2. WHEN a valid file is uploaded, THE PHP_API_System SHALL generate a unique filename, store the file in the public/uploads directory, and return the file path
3. WHEN a file upload exceeds the maximum size limit of 10MB, THE PHP_API_System SHALL return a 400 Bad Request error with a descriptive message
4. WHERE file type restrictions apply, THE PHP_API_System SHALL only accept PDF, JPG, JPEG, PNG, and WEBP formats
5. WHEN a file is successfully uploaded, THE PHP_API_System SHALL return the relative file path in the format /public/uploads/{filename}

### Requirement 7: Certificate Generation and Management

**User Story:** As an employee, I want to generate and manage certificates for approved applications, so that customers receive proper documentation

#### Acceptance Criteria

1. WHEN an employee generates a certificate for an approved application, THE PHP_API_System SHALL create a unique certificate_number and store the record in the certificates table
2. WHEN a user requests their certificate list, THE PHP_API_System SHALL retrieve all certificates associated with their applications from the MySQL_Database
3. WHEN an employee certificate is generated, THE PHP_API_System SHALL create a record in the employee_certificates table with a unique digital_signature
4. WHEN a retailer certificate is generated, THE PHP_API_System SHALL create a record in the retailer_certificates table with branch information
5. WHERE a certificate download is requested, THE PHP_API_System SHALL return the certificate_url from the File_Storage_System

### Requirement 8: Product and Order Management

**User Story:** As a retailer, I want to browse and purchase products, so that I can acquire necessary equipment for my business

#### Acceptance Criteria

1. WHEN a user requests the product catalog, THE PHP_API_System SHALL retrieve all active products with stock information from the MySQL_Database
2. WHEN a retailer places an order with WALLET payment method, THE PHP_API_System SHALL verify sufficient balance, deduct the amount, create the order, and create a transaction record
3. WHEN an admin updates order status to SHIPPED, THE PHP_API_System SHALL store the tracking_number and update the shipped_at timestamp
4. WHEN a user requests their order history, THE PHP_API_System SHALL retrieve orders with associated product details ordered by created_at descending
5. WHERE stock quantity is insufficient, THE PHP_API_System SHALL return a 400 Bad Request error preventing order creation

### Requirement 9: Payment Integration and Verification

**User Story:** As a user, I want to make secure payments and have them verified, so that my wallet is credited accurately

#### Acceptance Criteria

1. WHEN a user initiates a Razorpay payment, THE PHP_API_System SHALL create an order using the Razorpay API and return the order_id and key
2. WHEN a payment verification request is received with razorpay_signature, THE PHP_API_System SHALL verify the signature using HMAC SHA256 algorithm
3. WHEN payment verification succeeds, THE PHP_API_System SHALL update the wallet balance and create a COMPLETED transaction record
4. WHEN a user submits manual payment verification with screenshot, THE PHP_API_System SHALL create a PENDING record in the payment_verifications table
5. WHEN an admin approves a payment verification, THE PHP_API_System SHALL credit the wallet and update the verification status to APPROVED

### Requirement 10: Notification and Query Management

**User Story:** As a user, I want to receive notifications and submit support queries, so that I stay informed and can get help when needed

#### Acceptance Criteria

1. WHEN a system event occurs that requires user notification, THE PHP_API_System SHALL create a notification record with appropriate type and target_users JSON data
2. WHEN a user requests their notifications, THE PHP_API_System SHALL retrieve unread notifications where the user_id matches target_users array
3. WHEN a user marks a notification as read, THE PHP_API_System SHALL update the is_read field to TRUE in the MySQL_Database
4. WHEN a user submits a support query, THE PHP_API_System SHALL create a record in the queries table with status OPEN
5. WHEN an admin responds to a query, THE PHP_API_System SHALL update the response field, set responded_by, and update status to RESOLVED

### Requirement 11: Advertisement Management

**User Story:** As an admin, I want to manage advertisements for dashboard and login pages, so that I can display promotional content to users

#### Acceptance Criteria

1. WHEN a user requests active advertisements, THE PHP_API_System SHALL retrieve advertisements where is_active is TRUE and current date is between start_date and end_date
2. WHEN an admin creates a new advertisement, THE PHP_API_System SHALL store the image in the File_Storage_System and create the record in the advertisements table
3. WHEN a user clicks an advertisement, THE PHP_API_System SHALL increment the click_count field in the MySQL_Database
4. WHEN login advertisements are requested, THE PHP_API_System SHALL retrieve active records from the login_advertisements table ordered by display_order
5. WHERE an advertisement has expired based on end_date, THE PHP_API_System SHALL exclude it from active advertisement queries

### Requirement 12: Training Video Management

**User Story:** As an employee or retailer, I want to access training videos, so that I can learn how to use the system effectively

#### Acceptance Criteria

1. WHEN a user requests training videos, THE PHP_API_System SHALL retrieve all active videos from the training_videos table with category and level filters
2. WHEN a user views a training video, THE PHP_API_System SHALL increment the view_count field in the MySQL_Database
3. WHEN an admin creates a training video, THE PHP_API_System SHALL validate the video_url and store the record with thumbnail_url
4. WHERE category filter is applied, THE PHP_API_System SHALL return only videos matching the specified category
5. WHEN videos are retrieved, THE PHP_API_System SHALL order results by created_at descending

### Requirement 13: Refund Management System

**User Story:** As a retailer, I want to request refunds for rejected applications, so that I can recover my payment

#### Acceptance Criteria

1. WHEN a retailer submits a refund request with reason and documents, THE PHP_API_System SHALL create a PENDING record in the refunds table
2. WHEN an admin approves a refund, THE PHP_API_System SHALL credit the wallet, create a REFUND transaction, and update the refund status to APPROVED
3. WHEN an admin rejects a refund, THE PHP_API_System SHALL store the admin_response and update the status to REJECTED
4. WHEN a user requests their refund history, THE PHP_API_System SHALL retrieve refunds with associated application details from the MySQL_Database
5. WHERE a refund is linked to an application, THE PHP_API_System SHALL include the application_id and scheme information in the response

### Requirement 14: Branch and Registration Management

**User Story:** As an admin, I want to manage organizational branches and pending registrations, so that I can control system access and organization structure

#### Acceptance Criteria

1. WHEN an admin requests the branch list, THE PHP_API_System SHALL retrieve all active branches from the branches table
2. WHEN a new retailer registers with payment screenshot, THE PHP_API_System SHALL create a pending record in the pending_registrations table with status 'pending'
3. WHEN an admin approves a pending registration, THE PHP_API_System SHALL create a user record, create a wallet, generate a retailer certificate, and update the registration status to 'approved'
4. WHEN an admin rejects a registration, THE PHP_API_System SHALL update the status to 'rejected' and store the rejected_reason
5. WHERE registration fee configuration is requested, THE PHP_API_System SHALL retrieve the current fee from the registration_fees table

### Requirement 15: Analytics and Reporting

**User Story:** As an admin, I want to view system analytics and reports, so that I can monitor business performance and make informed decisions

#### Acceptance Criteria

1. WHEN an admin requests dashboard statistics, THE PHP_API_System SHALL calculate total users, active applications, pending wallet requests, and total revenue from the MySQL_Database
2. WHEN an admin requests application analytics with date range, THE PHP_API_System SHALL aggregate application counts by status and scheme
3. WHEN free service analytics are requested, THE PHP_API_System SHALL retrieve usage statistics from the free_service_usage table grouped by service
4. WHEN commission reports are generated, THE PHP_API_System SHALL calculate total commissions paid and pending grouped by retailer
5. WHERE date filters are applied to analytics queries, THE PHP_API_System SHALL use the created_at timestamp for filtering records

### Requirement 16: API Documentation and Error Handling

**User Story:** As a developer, I want comprehensive API documentation and consistent error responses, so that I can integrate with the API effectively

#### Acceptance Criteria

1. WHEN an API error occurs, THE PHP_API_System SHALL return a JSON response with error code, message, and HTTP status code
2. WHEN validation fails on any endpoint, THE PHP_API_System SHALL return a 400 Bad Request with detailed field-level error messages
3. WHEN authentication fails, THE PHP_API_System SHALL return a 401 Unauthorized response with error type 'AUTHENTICATION_FAILED'
4. WHEN authorization fails due to insufficient permissions, THE PHP_API_System SHALL return a 403 Forbidden response with error type 'INSUFFICIENT_PERMISSIONS'
5. WHERE a requested resource is not found, THE PHP_API_System SHALL return a 404 Not Found response with error type 'RESOURCE_NOT_FOUND'

### Requirement 17: CORS and Security Configuration

**User Story:** As a system administrator, I want proper CORS and security headers configured, so that the API is secure and accessible from authorized origins

#### Acceptance Criteria

1. WHEN a preflight OPTIONS request is received, THE PHP_API_System SHALL respond with appropriate CORS headers including Access-Control-Allow-Origin
2. WHEN any API request is processed, THE PHP_API_System SHALL include security headers such as X-Content-Type-Options and X-Frame-Options
3. WHERE the request origin matches the allowed origins list, THE PHP_API_System SHALL set Access-Control-Allow-Credentials to true
4. WHEN SQL queries are constructed with user input, THE PHP_API_System SHALL use prepared statements to prevent SQL injection attacks
5. WHEN file uploads are processed, THE PHP_API_System SHALL validate MIME types and sanitize filenames to prevent directory traversal attacks

### Requirement 18: Database Connection and Transaction Management

**User Story:** As a system, I want reliable database connections and transaction support, so that data integrity is maintained during complex operations

#### Acceptance Criteria

1. WHEN the PHP_API_System initializes, THE PHP_API_System SHALL establish a PDO connection to the MySQL_Database using credentials from environment configuration
2. WHEN a multi-step operation begins (such as application approval), THE PHP_API_System SHALL start a database transaction
3. WHEN all operations in a transaction complete successfully, THE PHP_API_System SHALL commit the transaction to the MySQL_Database
4. IF any operation in a transaction fails, THEN THE PHP_API_System SHALL rollback the transaction to maintain data consistency
5. WHEN database connection fails, THE PHP_API_System SHALL log the error and return a 503 Service Unavailable response

### Requirement 19: Environment Configuration Management

**User Story:** As a system administrator, I want environment-based configuration, so that I can deploy the API across different environments securely

#### Acceptance Criteria

1. WHEN the PHP_API_System starts, THE PHP_API_System SHALL load configuration from a .env file including database credentials and API keys
2. WHERE sensitive configuration values are required, THE PHP_API_System SHALL retrieve them from environment variables rather than hardcoded values
3. WHEN Razorpay integration is used, THE PHP_API_System SHALL load RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from environment configuration
4. WHEN JWT tokens are generated, THE PHP_API_System SHALL use the JWT_SECRET from environment configuration for signing
5. WHERE file upload paths are configured, THE PHP_API_System SHALL use the UPLOAD_PATH environment variable with a default fallback to public/uploads

### Requirement 20: API Endpoint Organization and Routing

**User Story:** As a developer, I want well-organized API endpoints with clear routing structure, so that the API is maintainable and easy to understand

#### Acceptance Criteria

1. WHEN the PHP_API_System receives a request, THE PHP_API_System SHALL route it to the appropriate controller based on the URL path and HTTP method
2. WHERE RESTful conventions apply, THE PHP_API_System SHALL use GET for retrieval, POST for creation, PUT/PATCH for updates, and DELETE for deletion
3. WHEN an endpoint requires path parameters (such as /api/users/{id}), THE PHP_API_System SHALL extract and validate the parameter before processing
4. WHERE endpoints are grouped by resource type, THE PHP_API_System SHALL organize them in separate controller files (UsersController, WalletController, etc.)
5. WHEN an unsupported HTTP method is used on an endpoint, THE PHP_API_System SHALL return a 405 Method Not Allowed response
