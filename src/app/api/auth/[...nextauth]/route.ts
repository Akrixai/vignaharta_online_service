import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { corsHeaders, handleCorsPreflightRequest } from '@/lib/cors';
import { NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

// Wrap the handler to add CORS headers
async function handlerWithCors(req: Request, context: any) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return handleCorsPreflightRequest();
    }

    // Call the NextAuth handler
    const response = await handler(req, context);

    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}

export { handlerWithCors as GET, handlerWithCors as POST, handlerWithCors as OPTIONS };
