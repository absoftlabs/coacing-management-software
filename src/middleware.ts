import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/logo"];
const PUBLIC_PREFIXES = ["/api/auth"];
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// A teacher account can only mark attendance and manage their own login.
const TEACHER_ALLOWED_PAGES = new Set(["/attendance", "/change-password"]);

function isTeacherAllowedApi(pathname: string, method: string): boolean {
    if (pathname === "/api/attendance") return true;
    if (pathname === "/api/batches" && method === "GET") return true;
    if (pathname === "/api/students" && method === "GET") return true;
    return false;
}

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_PATHS.includes(pathname)) return true;
    return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAssetPath(pathname: string): boolean {
    return (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/public")
    );
}

/** Lightweight CSRF defense: for cookie-authenticated, state-changing API
 *  calls, the request's Origin must match the site's own host. Browsers set
 *  Origin on every cross-site POST/PUT/PATCH/DELETE, so a forged request from
 *  another site is rejected here before it ever reaches a route handler. */
function hasValidOrigin(req: NextRequest): boolean {
    const origin = req.headers.get("origin");
    if (!origin) return true; // same-origin navigations/tools that omit Origin
    try {
        return new URL(origin).host === req.headers.get("host");
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isApi = pathname.startsWith("/api/");

    if (isAssetPath(pathname)) {
        return NextResponse.next();
    }

    if (isApi && UNSAFE_METHODS.has(req.method) && !hasValidOrigin(req)) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyAuthToken(token) : null;
    const authed = payload !== null;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-authenticated", authed ? "1" : "0");

    if (!authed) {
        if (isApi) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const res = NextResponse.redirect(new URL("/login", req.url));
        res.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
        return res;
    }

    if (payload.role === "teacher") {
        if (isApi) {
            if (!isTeacherAllowedApi(pathname, req.method)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else if (!TEACHER_ALLOWED_PAGES.has(pathname)) {
            return NextResponse.redirect(new URL("/attendance", req.url));
        }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
