"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { IconBuildingStore, IconMessage2Cog, IconPlus, IconUserShield } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { DEFAULT_ORG_LOGO } from "@/lib/org";

type Settings = {
    orgLogo: string | null;
    smsApiKey: string | null;
    smsSenderId: string | null;
};

type AdminRow = { _id: string; email: string | null; username: string; createdAt: string };

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checkingBalance, setCheckingBalance] = useState(false);
    const currentUser = useCurrentUser();

    const [logo, setLogo] = useState<string>("");
    const [smsApiKey, setSmsApiKey] = useState("");
    const [smsSenderId, setSmsSenderId] = useState("");

    const [admins, setAdmins] = useState<AdminRow[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(true);
    const [addAdminOpen, setAddAdminOpen] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [addAdminError, setAddAdminError] = useState("");
    const [addingAdmin, setAddingAdmin] = useState(false);
    const confirm = useConfirm();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/settings", { cache: "no-store" });
                if (res.ok) {
                    const data: Settings = await res.json();
                    setLogo(data.orgLogo || "");
                    setSmsApiKey(data.smsApiKey || "");
                    setSmsSenderId(data.smsSenderId || "");
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function loadAdmins() {
        setLoadingAdmins(true);
        try {
            const res = await fetch("/api/admins", { cache: "no-store" });
            if (res.ok) setAdmins(await res.json());
        } finally {
            setLoadingAdmins(false);
        }
    }

    useEffect(() => {
        void loadAdmins();
    }, []);

    async function onAddAdmin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setAddAdminError("");
        setAddingAdmin(true);
        try {
            const res = await fetch("/api/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newEmail.trim(), username: newUsername.trim(), password: newPassword }),
            });
            if (res.ok) {
                toast.success("Admin added");
                setAddAdminOpen(false);
                setNewEmail("");
                setNewUsername("");
                setNewPassword("");
                void loadAdmins();
            } else {
                const j = (await res.json().catch(() => ({}))) as { error?: string };
                setAddAdminError(j.error || "Failed to add admin");
            }
        } finally {
            setAddingAdmin(false);
        }
    }

    async function onDeleteAdmin(admin: AdminRow) {
        const ok = await confirm({
            title: "Remove this admin?",
            description: `${admin.username} will no longer be able to log in.`,
            confirmText: "Remove",
            variant: "destructive",
        });
        if (!ok) return;
        const res = await fetch(`/api/admins/${admin._id}`, { method: "DELETE" });
        if (res.ok) {
            setAdmins((prev) => prev.filter((a) => a._id !== admin._id));
            toast.success("Admin removed");
        } else {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            toast.error(j.error || "Failed to remove admin");
        }
    }

    function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setLogo(String(reader.result || ""));
        reader.readAsDataURL(file);
    }

    async function saveLogo() {
        setSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgLogo: logo || null }),
            });
            if (res.ok) toast.success("Logo updated");
            else toast.error("Failed to update logo");
        } finally {
            setSaving(false);
        }
    }

    async function saveSms() {
        setSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ smsApiKey: smsApiKey || null, smsSenderId: smsSenderId || null }),
            });
            if (res.ok) toast.success("SMS settings saved");
            else toast.error("Failed to save SMS settings");
        } finally {
            setSaving(false);
        }
    }

    async function checkBalance() {
        if (!smsApiKey.trim()) {
            toast.error("Enter an API key first");
            return;
        }
        setCheckingBalance(true);
        try {
            const res = await fetch("/api/settings/check-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: smsApiKey.trim() }),
            });
            const j = (await res.json().catch(() => ({}))) as { balance?: string; error?: string };
            if (res.ok) toast.success(`Balance: ৳ ${j.balance}`);
            else toast.error(j.error || "Failed to check balance");
        } finally {
            setCheckingBalance(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <IconBuildingStore className="size-5 text-muted-foreground" />
                        <CardTitle>Coaching Logo</CardTitle>
                    </div>
                    <CardDescription>Shown in the header and on printed invoices, mark sheets & reports.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Image
                            src={logo || DEFAULT_ORG_LOGO}
                            alt="Logo preview"
                            width={72}
                            height={72}
                            unoptimized
                            className="size-18 rounded-xl border object-cover"
                        />
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="logo">Upload new logo</Label>
                            <Input id="logo" type="file" accept="image/*" onChange={onLogoChange} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={saveLogo} disabled={saving}>
                            {saving ? "Saving..." : "Save Logo"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <IconMessage2Cog className="size-5 text-muted-foreground" />
                        <CardTitle>SMS API (BulkSMSBD)</CardTitle>
                    </div>
                    <CardDescription>Used to send result & custom SMS to guardians and teachers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="smsApiKey">API Key</Label>
                        <Input
                            id="smsApiKey"
                            value={smsApiKey}
                            onChange={(e) => setSmsApiKey(e.target.value)}
                            placeholder="e.g. JPzYg4XVGNSV1nEMWjQe"
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="smsSenderId">Sender ID</Label>
                        <Input
                            id="smsSenderId"
                            value={smsSenderId}
                            onChange={(e) => setSmsSenderId(e.target.value)}
                            placeholder="Approved sender ID from BulkSMSBD"
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={checkBalance} disabled={checkingBalance}>
                            {checkingBalance ? "Checking..." : "Check Balance"}
                        </Button>
                        <Button onClick={saveSms} disabled={saving}>
                            {saving ? "Saving..." : "Save SMS Settings"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconUserShield className="size-5 text-muted-foreground" />
                            <CardTitle>Admin Accounts</CardTitle>
                        </div>
                        <Button size="sm" onClick={() => setAddAdminOpen(true)}>
                            <IconPlus className="size-4" /> Add Admin
                        </Button>
                    </div>
                    <CardDescription>Accounts that can access the full admin panel.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingAdmins ? (
                        <Skeleton className="h-24 w-full" />
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins.map((a) => (
                                        <TableRow key={a._id}>
                                            <TableCell className="font-medium">{a.username}</TableCell>
                                            <TableCell>{a.email || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={a.username === currentUser?.username}
                                                    title={
                                                        a.username === currentUser?.username
                                                            ? "You can't remove your own account"
                                                            : undefined
                                                    }
                                                    onClick={() => onDeleteAdmin(a)}
                                                >
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add admin</DialogTitle>
                        <DialogDescription>They&apos;ll get full access to the admin panel.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={onAddAdmin}>
                        <div className="space-y-2">
                            <Label htmlFor="newEmail">Email</Label>
                            <Input
                                id="newEmail"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newUsername">Username</Label>
                            <Input
                                id="newUsername"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={8}
                                required
                            />
                            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                        </div>

                        {addAdminError && (
                            <Alert variant="destructive">
                                <AlertDescription>{addAdminError}</AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setAddAdminOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addingAdmin}>
                                {addingAdmin ? "Adding..." : "Add Admin"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
