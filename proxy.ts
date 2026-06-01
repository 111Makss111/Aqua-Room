import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const proxy = auth(request => {
  if (!request.auth && request.nextUrl.pathname.startsWith('/room')) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/room/:path*'],
};
