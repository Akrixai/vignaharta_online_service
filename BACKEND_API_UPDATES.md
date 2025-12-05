# Backend API Updates for Flutter App Compatibility

The following backend API endpoints have been updated to support the **Hybrid Authentication Model**.
They now accept both:
1.  **NextAuth Session Cookies** (for Web)
2.  **JWT Bearer Tokens** (for Flutter App)

This was achieved by replacing `getServerSession(authOptions)` with the new helper function `getAuthenticatedUser(request)`.

## Updated APIs

### Authentication
-   `src/app/api/auth/profile/route.ts` (New endpoint)
-   `src/app/api/auth/change-password/route.ts`
-   `src/app/api/auth/login/route.ts` (New endpoint for App Login)

### Wallet
-   `src/app/api/wallet/route.ts`
-   `src/app/api/wallet/transactions/route.ts`

### Commission
-   `src/app/api/transactions/commission/route.ts`

### Recharge & Bills
-   `src/app/api/recharge/detect-operator/route.ts`
-   `src/app/api/recharge/plans/route.ts`
-   `src/app/api/recharge/fetch-bill/route.ts`
-   `src/app/api/recharge/process/route.ts`
-   `src/app/api/recharge/circles/route.ts`
-   `src/app/api/recharge/operators/route.ts`
-   `src/app/api/recharge/transactions/route.ts`

### Services & Applications
-   `src/app/api/services/route.ts`
-   `src/app/api/applications/route.ts`
-   `src/app/api/notifications/route.ts`
-   `src/app/api/support-tickets/route.ts`

## Helper Functions
-   `src/lib/auth-helper.ts`: Contains `getAuthenticatedUser` logic.

## Next Steps
1.  **Redeploy Backend**: Push these changes to your production server (Vercel/VPS).
2.  **Test App**: Verify that all these features now work in the Flutter app without 401 errors.
