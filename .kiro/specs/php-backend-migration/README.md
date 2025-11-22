# PHP Backend Migration Spec

## Overview

This spec outlines the complete migration of the Vignaharta Online Service backend from Next.js API routes to a standalone PHP REST API. The migration maintains 100% API compatibility while providing a traditional PHP architecture suitable for cPanel hosting.

## Spec Documents

1. **[requirements.md](./requirements.md)** - Complete requirements with 20 user stories and EARS-compliant acceptance criteria
2. **[design.md](./design.md)** - Technical design including architecture, components, API endpoints, security, and deployment
3. **[tasks.md](./tasks.md)** - Implementation plan with 30 major tasks and 80+ actionable sub-tasks

## Quick Start

### To Execute Tasks

1. Open `tasks.md` in Kiro
2. Click "Start task" next to any task item
3. Kiro will implement the task based on the requirements and design

### Recommended Task Order

Start with the core infrastructure tasks in sequence:

1. **Task 1**: Project Setup and Core Infrastructure
2. **Task 2**: Utility Classes and Helpers
3. **Task 3**: Exception Classes
4. **Task 4**: Middleware Implementation
5. **Task 5**: Base Controller and Model Classes
6. **Task 6**: Authentication System

Then proceed with business logic modules based on priority.

## Key Features

### Technology Stack
- PHP 8.0+ with PDO
- MySQL 8.0+ (existing database)
- JWT authentication
- Razorpay payment integration
- Local file storage (public/uploads)

### Architecture
- Layered architecture (Router → Middleware → Controllers → Services → Models)
- RESTful API design
- Role-based access control (Admin, Employee, Retailer)
- Transaction management for data integrity

### API Endpoints (50+)
- Authentication (login, register, change password)
- User management
- Wallet operations (top-up, withdrawal, balance)
- Schemes and applications
- Products and orders
- Certificates (employee, retailer, application)
- Payment processing (Razorpay)
- File uploads
- Notifications and support
- Analytics and reporting
- And more...

## Project Structure

```
php-api/
├── public/
│   └── index.php              # Entry point
├── src/
│   ├── Config/                # Configuration
│   ├── Middleware/            # Auth, CORS, Validation
│   ├── Controllers/           # 20+ controllers
│   ├── Services/              # Business logic
│   ├── Models/                # Database models
│   ├── Utils/                 # Helpers (JWT, Validator, Response)
│   └── Exceptions/            # Custom exceptions
├── vendor/                    # Composer dependencies
├── .env                       # Environment variables
└── composer.json              # Dependencies
```

## Database

The spec uses your existing MySQL database (`vignaharta_db`) with all tables:
- users, wallets, wallet_requests, transactions
- schemes, applications, certificates
- products, orders
- advertisements, training_videos
- notifications, queries, refunds
- branches, pending_registrations
- And more...

## Security Features

- JWT token authentication with 24-hour expiration
- bcrypt password hashing (cost factor 12)
- SQL injection prevention (prepared statements)
- File upload validation (size, type, MIME)
- CORS configuration
- XSS prevention
- Security headers

## Testing Strategy

The spec includes comprehensive testing:
- Unit tests for models and services
- Integration tests for API endpoints
- Authentication flow testing
- File upload testing
- Payment integration testing
- End-to-end testing with frontend

## Deployment

The spec includes production deployment configuration:
- Environment variables (.env)
- Apache .htaccess configuration
- PHP configuration (php.ini)
- Security headers
- Performance optimization (caching, compression)

## Next Steps

1. **Review the spec documents** to understand the complete scope
2. **Start with Task 1** to set up the project structure
3. **Execute tasks incrementally** - each task builds on previous ones
4. **Test as you go** - validate each module before moving forward
5. **Deploy to production** once all core tasks are complete

## Support

If you need to modify the spec:
- Update `requirements.md` to add/change requirements
- Update `design.md` to adjust technical design
- Update `tasks.md` to add/modify implementation tasks

## Estimated Timeline

- **Core Infrastructure** (Tasks 1-5): 2-3 days
- **Authentication & Users** (Tasks 6-7): 1-2 days
- **Wallet & Transactions** (Tasks 8-10): 2-3 days
- **Schemes & Applications** (Tasks 11-12): 3-4 days
- **File Uploads & Certificates** (Tasks 13-14): 2-3 days
- **Products & Orders** (Task 15): 1-2 days
- **Payment Integration** (Task 16): 1-2 days
- **Additional Modules** (Tasks 17-25): 5-7 days
- **Security & Testing** (Tasks 26-28): 2-3 days
- **Deployment & Integration** (Tasks 29-30): 2-3 days

**Total Estimated Time**: 3-4 weeks for complete implementation

## Notes

- All file uploads continue to use the `public/uploads` directory
- The API maintains compatibility with your existing Next.js frontend
- Database schema remains unchanged - uses existing `vignaharta_db`
- JWT tokens replace NextAuth.js session cookies
- All 50+ API endpoints are documented in the design

---

**Ready to start?** Open `tasks.md` and click "Start task" on Task 1!
