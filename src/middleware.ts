import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host')
    const { pathname } = request.nextUrl

    // Check if the hostname is the admin domain
    // We check for "credai-admin" to be safe for local/preview URLs slightly, 
    // but strictly it should be credai-admin.vercel.app
    if (hostname && hostname.includes('credai-admin.vercel.app')) {
        // If visiting root on admin domain, rewrite to /admin
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/admin', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
