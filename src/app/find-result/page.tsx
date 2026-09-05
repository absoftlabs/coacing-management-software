import { IconAdjustmentsSearch } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                    <IconAdjustmentsSearch className="size-10" />
                    <p>Coming soon</p>
                </CardContent>
            </Card>
        </div>
    );
}
