
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_IP = '187.84.154.199';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const ip = requestHeaders.get('x-forwarded-for') ?? request.ip;

  if (request.nextUrl.pathname.startsWith('/admin') && ip !== ALLOWED_IP) {
    return new Response('Acesso negado', { status: 403 });
  }

  return NextResponse.next();
}
