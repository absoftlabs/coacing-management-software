import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "cms_token";
const TOKEN_TTL = "7d";

export type AuthPayload = {
    sub: string;
    role: "admin";
    email: string;
    username: string;
};

function getSecretKey(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("Missing JWT_SECRET");
    }
    return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthPayload): Promise<string> {
    const secret = getSecretKey();
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(TOKEN_TTL)
        .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
    try {
        const secret = getSecretKey();
        const { payload } = await jwtVerify(token, secret);
        return payload as AuthPayload;
    } catch {
        return null;
    }
}

export function setAuthCookie(res: NextResponse, token: string) {
    res.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}

export function clearAuthCookie(res: NextResponse) {
    res.cookies.set(AUTH_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });
}

export async function getAuthFromRequest(req: NextRequest): Promise<AuthPayload | null> {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAuthToken(token);
}
