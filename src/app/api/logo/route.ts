import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// GET /api/logo — public (no auth required) so the logo can render on the
// login page too. Only returns the logo, never the SMS credentials that
// /api/settings also holds.
export async function GET() {
    try {
        const { orgLogo } = await getSettings();
        return NextResponse.json({ orgLogo });
    } catch (error) {
        console.error("GET /api/logo error:", error);
        return NextResponse.json({ orgLogo: null });
    }
}
