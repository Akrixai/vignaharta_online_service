# Product Documentation: Digi Ai
**Powered by Akrix Solutions**

---

## Table of Contents
1. [Product Overview](#product-overview)
2. [Technical Documentation](#technical-documentation)
3. [Branding Guidelines](#branding-guidelines)
4. [Contact Information](#contact-information)
5. [Additional Sections](#additional-sections)

---

## 1. Product Overview

### Description
**Digi Ai** is a comprehensive digital services platform developed under the **Akrix Solutions** brand. It serves as a one-stop portal for Government-to-Citizen (G2C) and Business-to-Citizen (B2C) services. The platform empowers a network of retailers (agents) to provide essential services to end customers, including PAN card applications, utility bill payments, mobile recharges, and various government scheme applications.

The system is designed to bridge the digital divide by enabling local retailers to act as service points for rural and semi-urban populations, facilitating easy access to digital and financial services.

### Key Features
*   **Multi-Role Access Control:** Secure login and dashboard for Admins, Employees, and Retailers.
*   **Wallet System:** Integrated digital wallet for retailers to manage funds, deposit money, and pay for services.
*   **Service Management:**
    *   **PAN Services:** New PAN card applications and corrections (NSDL/UTI integration).
    *   **Recharge & Bill Payments:** Mobile, DTH, and utility bill payments via KwikAPI.
    *   **Government Schemes:** Application processing for various state and central government schemes.
*   **Application Tracking:** Real-time status tracking for all service applications (Pending, Approved, Rejected, Completed).
*   **Certificate Generation:** Automated generation of authorization certificates for retailers and employees.
*   **Training & Support:** Integrated training video module and support ticketing system.
*   **Marketing Tools:** Advertisement management and promotional banners.
*   **Reporting & Analytics:** Comprehensive transaction logs, commission reports, and usage analytics.

### System Architecture
The platform follows a modern, scalable 3-tier architecture:

```mermaid
graph TD
    User[User (Retailer/Admin)] -->|HTTPS| CDN[CDN / Edge Network]
    CDN -->|Next.js App| Frontend[Frontend (Next.js)]
    Frontend -->|API Routes| Backend[Backend API (Next.js)]
    Backend -->|Auth| NextAuth[NextAuth.js]
    Backend -->|Data| DB[(PostgreSQL / Supabase)]
    Backend -->|Payments| PG[Payment Gateways (Cashfree, Razorpay)]
    Backend -->|Services| extAPI[External APIs (KwikAPI, NSDL, etc.)]
```

### Technology Stack
*   **Frontend Framework:** [Next.js](https://nextjs.org/) (React)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Authentication:** NextAuth.js
*   **Database:** PostgreSQL (managed via Supabase)
*   **State Management:** React Hooks & Context API
*   **Payment Integration:** Cashfree, Razorpay
*   **External APIs:** KwikAPI (Recharge/Bill Payment), SMS Gateways
*   **Deployment:** Vercel / Netlify (compatible)

---

## 2. Technical Documentation

### Codebase Structure
The project is organized using the Next.js App Router structure:

```
src/
├── app/                    # App Router pages and API routes
│   ├── api/                # Backend API endpoints
│   │   ├── admin/          # Admin-specific API routes
│   │   ├── auth/           # Authentication routes (NextAuth)
│   │   ├── services/       # Service application routes
│   │   └── wallet/         # Wallet transaction routes
│   ├── admin/              # Admin dashboard pages
│   ├── dashboard/          # User (Retailer) dashboard pages
│   └── (public)/           # Public facing pages (Home, About, etc.)
├── components/             # Reusable React components
│   ├── ui/                 # UI primitives (Buttons, Inputs, etc.)
│   └── ...
├── lib/                    # Utility functions and configurations
│   ├── prisma.ts           # DB client instance (if applicable)
│   └── utils.ts            # Helper functions
└── ...
```

### API Documentation
The platform exposes a RESTful API via Next.js API Routes.

**Base URL:** `https://vighnahartaonlineservice.in/api`

#### Key Endpoints:
*   **Authentication:**
    *   `POST /auth/login`: Authenticate user.
    *   `POST /auth/register`: Register a new retailer.
*   **User Management:**
    *   `GET /users`: List users (Admin only).
    *   `GET /users/[id]`: Get user details.
*   **Wallet:**
    *   `GET /wallet/balance`: Get current wallet balance.
    *   `POST /wallet/add-money`: Initiate wallet top-up.
*   **Services:**
    *   `POST /services/[id]/apply`: Submit a new application.
    *   `GET /applications`: List submitted applications.

*(Refer to the detailed `API_DOCUMENTATION.md` in the `docs/` folder for full request/response examples.)*

### Database Schema
The database is built on PostgreSQL. Key relationships include:

*   **Users:** Stores account info for Admins, Employees, and Retailers.
*   **Wallets:** One-to-One relationship with Users. Stores current balance.
*   **Transactions:** One-to-Many relationship with Wallets. Tracks all financial movements.
*   **Schemes:** Catalog of available services.
*   **Applications:** One-to-Many relationship with Users and Schemes. Stores application data and status.

### Installation & Deployment

#### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   PostgreSQL database (local or cloud)

#### Setup Instructions
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/akrix-solutions/vighnaharta.git
    cd vighnaharta
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory with the following variables:
    ```env
    DATABASE_URL="postgresql://user:password@host:port/db_name"
    NEXTAUTH_SECRET="your-secret-key"
    NEXTAUTH_URL="http://localhost:3000"
    NEXT_PUBLIC_API_URL="http://localhost:3000/api"
    CASHFREE_APP_ID="your-cashfree-id"
    CASHFREE_SECRET_KEY="your-cashfree-secret"
    # Add other service keys as needed
    ```

4.  **Run Database Migrations:**
    Initialize the database schema (using the provided SQL scripts in `database/`).

5.  **Start Development Server:**
    ```bash
    npm run dev
    ```

6.  **Build for Production:**
    ```bash
    npm run build
    npm start
    ```

---

## 3. Branding Guidelines

### Brand Identity
**Akrix Solutions** is the parent brand powering the Digi Ai platform. All public-facing communications and documentation should reflect the professional and reliable nature of the Akrix Solutions brand.

### Usage
*   **Akrix Solutions:** Use this name when referring to the technology provider, development team, or corporate entity.
*   **Digi Ai:** Use this name when referring to the specific product/portal used by retailers and customers.
*   **Powered by Akrix Solutions:** This tagline should appear in the footer of the application and on login/registration pages.

### Color Scheme
The primary color palette is designed to build trust and energy.

*   **Primary Red:** `#dc2626` (Used for primary buttons, headers, and accents)
*   **Secondary White:** `#ffffff` (Backgrounds)
*   **Text Dark:** `#1f2937` (Primary text)
*   **Text Light:** `#6b7280` (Secondary text)

### Typography
The platform uses modern, legible fonts to ensure readability across devices.

*   **Primary Font:** `Inter` (Latin) - Used for headings and body text in English.
*   **Secondary Font:** `Noto Sans Devanagari` - Used for Marathi/Hindi content support.

### Logo Placement
*   **Header:** The Digi Ai logo should be placed on the top left.
*   **Footer:** The "Powered by Akrix Solutions" branding should be centered or right-aligned in the footer.
*   **Favicon:** Use the simplified icon version of the logo.

---

## 4. Contact Information

For inquiries, support, or partnership opportunities, please contact Akrix Solutions:

*   **Mobile:** 9819399470
*   **Email:** [hi@akrixsolutions.in](mailto:hi@akrixsolutions.in)
*   **Website:** [www.vighnahartaonlineservice.in](https://www.vighnahartaonlineservice.in)

---

## 5. Additional Sections

### User Manual
*   **Retailer Onboarding:**
    1.  Register via the "Register as Retailer" link.
    2.  Complete the KYC process by uploading Aadhaar and PAN cards.
    3.  Wait for Admin approval (typically 24-48 hours).
    4.  Once approved, log in and add funds to your wallet to start transacting.
*   **Applying for Services:**
    1.  Navigate to the "Services" dashboard.
    2.  Select the desired service (e.g., PAN Card).
    3.  Fill in the customer details and upload required documents.
    4.  Submit the application. The fee will be deducted from your wallet.

### Troubleshooting and FAQ
*   **Q: My wallet recharge failed but money was deducted.**
    *   A: Please wait 15 minutes for the status to update. If it remains failed, contact support with the transaction ID.
*   **Q: How do I reset my password?**
    *   A: Use the "Forgot Password" link on the login page to receive a reset link via email.
*   **Q: Why is my application status "Pending"?**
    *   A: Applications are processed manually by our backend team. Standard processing time is 24-48 hours.

### Future Roadmap
*   **Mobile App:** Launch of a dedicated Android application for retailers.
*   **More Services:** Integration of insurance and loan services.
*   **Automated KYC:** Instant retailer approval using AI-based document verification.

### Maintenance and Support
*   **Regular Maintenance:** Scheduled every Sunday from 2:00 AM to 4:00 AM IST.
*   **Support Hours:** Monday to Saturday, 9:00 AM - 6:00 PM IST.
*   **Emergency Support:** Available 24/7 for critical system outages.

---
*Document Version: 1.0 | Last Updated: January 2026*
