import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/workspace",
  "/tasks",
  "/projects"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionId = request.cookies.get("sid")?.value;

  const isAuthenticated = Boolean(sessionId);

  //  Check protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workspace/:path*",
    "/tasks/:path*",
  ],
};