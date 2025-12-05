import { NextResponse } from 'next/server';

/**
 * CORS Configuration for API Routes
 * Allows all origins for development and production
 */

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCorsPreflightRequest() {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(data: any, status: number = 200) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
        },
    });
}

/**
 * Wrapper for API route handlers to add CORS support
 */
export function withCors(handler: (req: Request) => Promise<NextResponse>) {
    return async (req: Request) => {
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return handleCorsPreflightRequest();
        }

        // Execute the handler and add CORS headers to response
        const response = await handler(req);
        return addCorsHeaders(response);
    };
}
