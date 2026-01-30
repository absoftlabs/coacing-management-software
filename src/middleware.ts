import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_PREFIXES = ["/api/auth"];

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

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (isAssetPath(pathname) || isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const authed = token ? (await verifyAuthToken(token)) !== null : false;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-authenticated", authed ? "1" : "0");

    if (!authed) {
        const res = NextResponse.redirect(new URL("/login", req.url));
        res.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
        return res;
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
