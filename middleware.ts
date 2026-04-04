// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore next-auth v4 types don't resolve with moduleResolution:bundler
import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(request: NextRequest) {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = btoa(String.fromCharCode(...array));
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://wsupabasew.waichatt.com",
    "font-src 'self'",
    "connect-src 'self' https://wsupabasew.waichatt.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  // Fix: cuando el tunnel añade x-forwarded-host, Next.js lo compara con el
  // header origin del browser. Si no coinciden, aborta las Server Actions.
  // Sincronizamos x-forwarded-host con el host del origin para que pase la validación.
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (origin && forwardedHost) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== forwardedHost) {
        requestHeaders.set("x-forwarded-host", originHost);
      }
    } catch {
      // origin inválido, no hacer nada
    }
  }

  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Sin sesión → login (para rutas protegidas)
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/superadmin")) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Sesión activa en /auth → redirigir al home correcto según rol
  if (token && pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = token.role === "superadmin" ? "/superadmin" : "/dashboard/finanzas";
    return NextResponse.redirect(url);
  }

  // Superadmin solo puede estar en /superadmin
  if (token?.role === "superadmin" && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/superadmin";
    return NextResponse.redirect(url);
  }

  // Usuarios no-superadmin no pueden acceder a /superadmin
  if (token && token.role !== "superadmin" && pathname.startsWith("/superadmin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/finanzas";
    return NextResponse.redirect(url);
  }

  // branch no puede acceder a rutas exclusivas de admin
  if (token?.role === "branch" && pathname.startsWith("/dashboard/marketing")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/finanzas";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
