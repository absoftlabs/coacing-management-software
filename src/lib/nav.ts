import {
    IconAddressBook,
    IconAdjustmentsSearch,
    IconApps,
    IconBackpack,
    IconBrowserPlus,
    IconChalkboardTeacher,
    IconChecklist,
    IconClipboardPlus,
    IconCurrencyTaka,
    IconDashboard,
    IconFileCheck,
    IconGraph,
    IconListDetails,
    IconMessage2,
    IconMessage2Plus,
    IconMessageChatbot,
    IconMessagePlus,
    IconPlayerPause,
    IconSchool,
    IconSettings,
    IconSquarePlus,
    IconUserPause,
    IconUserPlus,
    IconWallet,
    type Icon,
} from "@tabler/icons-react";

export type NavLeaf = { label: string; href: string; icon: Icon };
export type NavGroup = { label: string; icon: Icon; items: NavLeaf[] };
export type NavEntry = NavLeaf | NavGroup;

export const NAV: NavEntry[] = [
    { label: "Dashboard", href: "/", icon: IconDashboard },
    {
        label: "Student Management",
        icon: IconSchool,
        items: [
            { label: "Add Student", href: "/add-student", icon: IconUserPlus },
            { label: "Student List", href: "/student-list", icon: IconListDetails },
            { label: "Suspended Students", href: "/suspended-students", icon: IconUserPause },
            { label: "Student Report", href: "/students-report", icon: IconGraph },
        ],
    },
    {
        label: "Teacher Management",
        icon: IconChalkboardTeacher,
        items: [
            { label: "Add Teacher", href: "/add-teacher", icon: IconSquarePlus },
            { label: "Teacher List", href: "/teacher-list", icon: IconListDetails },
            { label: "Suspended Teachers", href: "/suspended-teacher", icon: IconPlayerPause },
            { label: "Teacher Report", href: "/teachers-report", icon: IconGraph },
        ],
    },
    {
        label: "Class Management",
        icon: IconBackpack,
        items: [
            { label: "Add Class", href: "/add-class", icon: IconBrowserPlus },
            { label: "Class List", href: "/class-list", icon: IconAddressBook },
            { label: "Class Report", href: "/classes-report", icon: IconGraph },
        ],
    },
    { label: "Batch", href: "/batch-list", icon: IconBrowserPlus },
    {
        label: "Result Management",
        icon: IconClipboardPlus,
        items: [
            { label: "Add Result", href: "/add-result", icon: IconClipboardPlus },
            { label: "Result List", href: "/result-list", icon: IconClipboardPlus },
            { label: "Result Parameters", href: "/result-parameters", icon: IconApps },
            { label: "Find Result", href: "/find-result", icon: IconAdjustmentsSearch },
            { label: "Result Report", href: "/results-report", icon: IconGraph },
        ],
    },
    {
        label: "Fees Management",
        icon: IconCurrencyTaka,
        items: [
            { label: "Collect Fees", href: "/add-fees", icon: IconWallet },
            { label: "Fees List", href: "/fees-list", icon: IconFileCheck },
        ],
    },
    { label: "Mark Attendance", href: "/attendance", icon: IconChecklist },
    {
        label: "SMS Management",
        icon: IconMessage2,
        items: [
            { label: "SMS Templates", href: "/sms/templates", icon: IconMessage2Plus },
            { label: "SMS Students", href: "/sms/students", icon: IconMessageChatbot },
            { label: "SMS Teachers", href: "/sms/teachers", icon: IconMessagePlus },
        ],
    },
    { label: "Settings", href: "/settings", icon: IconSettings },
];

export function isNavGroup(entry: NavEntry): entry is NavGroup {
    return "items" in entry;
}

const TEACHER_NAV: NavEntry[] = [{ label: "Mark Attendance", href: "/attendance", icon: IconChecklist }];

/** Teachers can only mark attendance; everyone else sees the full nav. */
export function getNavForRole(role: "admin" | "teacher" | undefined): NavEntry[] {
    return role === "teacher" ? TEACHER_NAV : NAV;
}

const TITLE_OVERRIDES: Record<string, string> = {
    "/change-password": "Change Password",
};

/** Finds the nav label matching a pathname, falling back to a
 *  title-cased version of the last path segment. */
export function getPageTitle(pathname: string): string {
    if (TITLE_OVERRIDES[pathname]) return TITLE_OVERRIDES[pathname];

    for (const entry of NAV) {
        if (isNavGroup(entry)) {
            const match = entry.items.find((i) => i.href === pathname);
            if (match) return match.label;
        } else if (entry.href === pathname) {
            return entry.label;
        }
    }

    const last = pathname.split("/").filter(Boolean).pop() ?? "";
    if (!last) return "Dashboard";
    return last
        .split("-")
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(" ");
}
