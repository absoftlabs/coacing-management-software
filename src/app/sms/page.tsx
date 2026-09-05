import { IconMessage2 } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                    <IconMessage2 className="size-10" />
                    <p>Choose a section from the SMS Management menu — Templates, Students, or Teachers.</p>
                </CardContent>
            </Card>
        </div>
    );
}
