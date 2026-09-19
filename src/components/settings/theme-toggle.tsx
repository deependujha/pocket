"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
    { key: "light", label: "Light", Icon: Sun },
    { key: "dark", label: "Dark", Icon: Moon },
    { key: "system", label: "System", Icon: MonitorSmartphone },
];

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    // true only after hydration, so the server and first client render agree
    const mounted = useSyncExternalStore( () => () => {}, () => true, () => false );
    const current = mounted ? theme ?? "system" : "system";
    return (
        <div className="card p-1.5" role="radiogroup" aria-label="Theme">
            <div className="grid grid-cols-3 gap-1">
                { OPTIONS.map( ( { key, label, Icon } ) => {
                    const on = current === key;
                    return (
                        <button key={ key } role="radio" aria-checked={ on } onClick={ () => setTheme( key ) }
                            className={ cn( "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-colors", on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground" ) }>
                            <Icon size={ 16 } /> { label }
                        </button>
                    );
                } ) }
            </div>
        </div>
    );
}
