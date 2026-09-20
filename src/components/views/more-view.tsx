"use client";

import { useData } from "@/components/shell/data-provider";
import { Section } from "@/components/ui/page";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { ExportButton } from "@/components/settings/export-button";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { inr } from "@/lib/money";
import { loanLeft } from "@/lib/derive";
import { Rise } from "@/components/shell/motion";

export function MoreView() {
    const { user, data: { sections, funds, loans } } = useData();
    const wishes = sections.flatMap( s => s.wishes );
    const saved = funds.reduce( ( s, f ) => s + f.balance, 0 );
    const owe = loans.filter( l => !l.closed && l.direction === "BORROWED" ).reduce( ( s, l ) => s + loanLeft( l ), 0 );
    const owed = loans.filter( l => !l.closed && l.direction === "LENT" ).reduce( ( s, l ) => s + loanLeft( l ), 0 );
    return (
        <div>
            <Rise className="flex items-center gap-4 pt-4 pb-5">
                { user.image ? ( /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={ user.image } alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full ring-2 ring-me/50" /> )
                    : <div className="h-14 w-14 rounded-full bg-muted" /> }
                <div className="min-w-0">
                    <div className="truncate text-xl font-semibold">{ user.name ?? "You" }</div>
                    <div className="truncate text-sm text-muted-foreground">{ user.email }</div>
                </div>
            </Rise>

            <Section title="At a glance">
                <ul className="card divide-y divide-border text-sm">
                    <li className="flex justify-between px-4 py-3"><span>In funds</span><span className="tabular font-medium text-fund">{ inr( saved ) }</span></li>
                    <li className="flex justify-between px-4 py-3"><span>Wishes open</span><span className="tabular font-medium text-wish">{ wishes.filter( w => !w.done ).length } of { wishes.length }</span></li>
                    <li className="flex justify-between px-4 py-3"><span>You owe</span><span className={ `tabular font-medium ${owe > 0 ? "text-loan" : ""}` }>{ inr( owe ) }</span></li>
                    <li className="flex justify-between px-4 py-3"><span>Owed to you</span><span className={ `tabular font-medium ${owed > 0 ? "text-status-good-text" : ""}` }>{ inr( owed ) }</span></li>
                </ul>
            </Section>

            <Section title="Appearance"><ThemeToggle /></Section>

            <Section title="Data">
                <div className="card space-y-3 p-4">
                    <ExportButton />
                    <SignOutButton />
                </div>
            </Section>
            <p className="pb-4 text-center text-xs text-muted-foreground/75">Stored in your own database. Nothing is linked to a bank.</p>
        </div>
    );
}
