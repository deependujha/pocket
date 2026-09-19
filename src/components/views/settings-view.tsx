"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useData } from "@/components/shell/data-provider";
import { PageHeader, Section } from "@/components/ui/page";
import { SettingsForm } from "@/components/settings/settings-form";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { ExportButton } from "@/components/settings/export-button";
import { ThemeToggle } from "@/components/settings/theme-toggle";

const GUIDE: [ string, string, string ][] = [
    [ "💳", "Debt first", "Anything owed is paid off the top of the surplus before it is split." ],
    [ "🛟", "Job-loss cover", "Months of expenses in a deposit you never touch. Only if salary stops." ],
    [ "🏥", "Health fund", "A separate pot for hospital bills. Insurance premiums are an expense, not savings." ],
    [ "💧", "Cash buffer", "About one month of expenses free in the savings account, so a surprise never touches the covers." ],
    [ "🎉", "One deposit per goal", "A fun fund, a trip, a phone: each gets its own FD or RD. When it matures the money already has a name." ],
    [ "🌱", "SIPs from month one", "Nifty 50 and a little gold, on autopilot. Raise them with every raise. No end date." ],
    [ "🔁", "Phases", "Split the surplus by percentage. When a goal fills, decide the next split. The Plan tab asks you." ],
];

export function SettingsView() {
    const { data: { settings }, user } = useData();
    const [ seg, setSeg ] = useState<"settings" | "info">( "settings" );
    const item = ( key: typeof seg, label: string ) => (
        <button type="button" onClick={ () => setSeg( key ) } aria-current={ seg === key ? "page" : undefined }
            className={ cn( "flex-1 rounded-full py-1.5 text-center text-sm transition-colors", seg === key ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground" ) }>{ label }</button>
    );
    return (
        <div>
            <div className="mt-1 flex rounded-full bg-muted p-1">{ item( "settings", "Settings" ) }{ item( "info", "Info" ) }</div>
            { seg === "settings" ? (
                <>
                    <PageHeader title="Settings" subtitle={ user.email } />
                    <Section title="Your numbers" hint="Surplus and the security score come from these.">
                        <SettingsForm settings={ settings } />
                    </Section>
                    <Section title="Appearance">
                        <ThemeToggle />
                    </Section>
                    <Section title="Data" hint="Stored in your own database. Nothing is linked to a bank.">
                        <div className="card space-y-3 p-4">
                            <ExportButton />
                            <SignOutButton />
                        </div>
                    </Section>
                </>
            ) : (
                <>
                    <PageHeader title="Info" subtitle="How Pocket thinks about money." />
                    <ol className="card divide-y divide-border text-sm">
                        { GUIDE.map( ( [ e, t, d ] ) => (
                            <li key={ t } className="flex gap-3 px-4 py-3"><span className="text-lg leading-6">{ e }</span><div><div className="font-medium">{ t }</div><div className="mt-0.5 text-muted-foreground">{ d }</div></div></li>
                        ) ) }
                    </ol>
                    <Section title="Score" hint="How the security number is built." className="mt-6">
                        <ul className="card divide-y divide-border text-sm">
                            { [ [ "Runway", "30", "Job-loss cover ÷ monthly expenses, against your target months." ], [ "Cash buffer", "15", "One month of expenses free after card dues." ], [ "Debt", "20", "Nothing owed scores full; half of assets owed scores zero." ], [ "Investing", "20", "20% of income into SIPs, or 40% of assets invested." ], [ "Goals", "15", "Dated goals at or ahead of pace." ] ].map( ( [ t, m, d ] ) => (
                                <li key={ t } className="flex items-start gap-3 px-4 py-3"><span className="w-8 shrink-0 text-right tabular font-semibold">{ m }</span><div><div className="font-medium">{ t }</div><div className="mt-0.5 text-muted-foreground">{ d }</div></div></li>
                            ) ) }
                        </ul>
                    </Section>
                </>
            ) }
            <p className="pb-4 pt-2 text-center text-xs text-muted-foreground/75">Pocket · { user.name ?? user.email }</p>
        </div>
    );
}
