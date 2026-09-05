import { prisma } from "@/lib/prisma";

export type AppSettings = {
    orgLogo: string | null;
    smsApiKey: string | null;
    smsSenderId: string | null;
};

const DEFAULT_ID = 1;

export async function getSettings(): Promise<AppSettings> {
    const row = await prisma.settings.findUnique({ where: { id: DEFAULT_ID } });
    return {
        orgLogo: row?.orgLogo ?? null,
        smsApiKey: row?.smsApiKey || process.env.SMS_API_KEY || null,
        smsSenderId: row?.smsSenderId || process.env.SMS_SENDER_ID || null,
    };
}

export async function saveSettings(data: Partial<Omit<AppSettings, never>>) {
    return prisma.settings.upsert({
        where: { id: DEFAULT_ID },
        update: data,
        create: { id: DEFAULT_ID, ...data },
    });
}
