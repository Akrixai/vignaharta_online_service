import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, verifyAuth } from './auth';

/**
 * Get authenticated user from either NextAuth session (cookies) or JWT token (Bearer)
 * This allows the API to work with both web (NextAuth) and mobile (JWT) clients
 */
export async function getAuthenticatedUser(request: NextRequest) {
    // First, try to get session from NextAuth (for web/cookie-based auth)
    const session = await getServerSession(authOptions);

    if (session?.user) {
        return {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
        };
    }

    // If no session, try JWT token from Authorization header (for mobile/token-based auth)
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const user = await verifyAuth(authHeader);
        return user;
    }

    return null;
}
