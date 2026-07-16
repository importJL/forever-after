import { NextResponse, type NextRequest } from 'next/server'
import { isAuthenticated } from '@/lib/amplify-server'

const protectedPaths = ['/app']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const authenticated = await isAuthenticated(request)

  if (!authenticated) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*'],
}
