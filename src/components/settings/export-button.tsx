"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton() {
    return (
        <Button variant="outline" className="w-full rounded-xl" asChild>
            <a href="/api/export" download><Download size={ 16 } /> Export everything as JSON</a>
        </Button>
    );
}
