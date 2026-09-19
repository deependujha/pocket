"use client";

import { useData } from "@/components/shell/data-provider";
import { PageHeader, Section } from "@/components/ui/page";
import { SettingsForm } from "@/components/settings/settings-form";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { ExportButton } from "@/components/settings/export-button";
import { ThemeToggle } from "@/components/settings/theme-toggle";

const GUIDE: [ string, string, string ][] = [
    [ "🛟", "Job-loss cover first", "Months of expenses in a deposit you never touch. Break it only if salary stops. This is what lets you sleep." ],
    [ "🏥", "A separate health fund", "Hospital bills come without notice. Insurance premiums are an expense; this pot is on top of them." ],
    [ "💧", "Then a cash buffer", "About one month of expenses sitting free in your savings account, so a surprise bill never touches the covers or the card." ],
    [ "💳", "Card paid in full", "A credit card is fine if the bill is paid in full every month. Track the amount owed here so it's subtracted from net worth honestly." ],
    [ "🎉", "One deposit per goal", "A fun fund, a trip, a phone at Diwali — each gets its own FD or RD. When it matures, the money already has a name." ],
    [ "🌱", "SIPs you never stop", "Nifty 50 and a little gold, every month, on autopilot, from the first month. Increase with every raise." ],
    [ "🔁", "Overflow is the plan", "When a pot fills up, its monthly amount rolls to the next one. The Plan tab shows the phases that creates." ],
];

export function SettingsView() {
    const { data: { settings }, user } = useData();
    return (
        <div>
            <PageHeader title="Settings" subtitle={ user.email } />
            <Section title="Your numbers" hint="Surplus, runway and the health score are measured against these.">
                <SettingsForm settings={ settings } />
            </Section>
            <Section title="Appearance">
                <ThemeToggle />
            </Section>
            <Section title="How Pocket thinks about money">
                <ol className="card divide-y divide-border text-sm">
                    { GUIDE.map( ( [ e, t, d ] ) => (
                        <li key={ t } className="flex gap-3 px-4 py-3"><span className="text-lg leading-6">{ e }</span><div><div className="font-medium">{ t }</div><div className="mt-0.5 text-muted-foreground">{ d }</div></div></li>
                    ) ) }
                </ol>
            </Section>
            <Section title="Your data" hint="Everything lives in your own Postgres database. Nothing is linked to a bank.">
                <div className="card space-y-3 p-4">
                    <ExportButton />
                    <SignOutButton />
                </div>
            </Section>
            <p className="pb-4 text-center text-xs text-muted-foreground/75">Pocket v3 · signed in as { user.name ?? user.email }</p>
        </div>
    );
}
