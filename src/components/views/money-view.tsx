"use client";

import { ChevronRight, Landmark, HandCoins } from "lucide-react";
import { useData } from "@/components/shell/data-provider";
import { NavLink, navigate, type MoneySub } from "@/lib/view";
import { ACCOUNT_GROUPS, ACCOUNT_TYPES, BUCKETS } from "@/lib/constants";
import { bucketOf, gainOf, isDebt, loanOutstanding, loanPaid, type LoanWithPayments } from "@/lib/finance";
import { fmtDate, inr, inrCompact, inrDelta, relativeDays, daysBetween } from "@/lib/money";
import { PageHeader, Section, Empty, Stat } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { Status } from "@/components/ui/status";
import { Sparkline } from "@/components/charts/sparkline";
import { AddAccountButton } from "@/components/accounts/account-sheets";
import { AddLoanButton } from "@/components/loans/loan-sheets";
import { cn } from "@/lib/utils";

function Switch( { active }: { active: MoneySub } ) {
    const item = ( key: MoneySub, label: string ) => (
        <button type="button" onClick={ () => navigate( { tab: "money", sub: key }, { replace: true, keepScroll: true } ) } aria-current={ active === key ? "page" : undefined }
            className={ cn( "flex-1 rounded-full py-1.5 text-center text-sm transition-colors", active === key ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground" ) }>{ label }</button>
    );
    return <div className="mt-1 flex rounded-full bg-muted p-1">{ item( "accounts", "Accounts" ) }{ item( "loans", "Loans" ) }</div>;
}

export function MoneyView( { sub }: { sub: MoneySub } ) {
    return (
        <div>
            <Switch active={ sub } />
            { sub === "loans" ? <Loans /> : <Accounts /> }
        </div>
    );
}

function Accounts() {
    const { data: { accounts, goals, movements } } = useData();
    const goalOpts = goals.filter( g => g.status === "ACTIVE" ).map( g => ( { id: g.id, name: g.name, emoji: g.emoji } ) );
    const live = accounts.filter( a => !a.archived );
    const archived = accounts.filter( a => a.archived );
    const total = live.filter( a => !isDebt( a ) ).reduce( ( s, a ) => s + a.balance, 0 );
    const owed = live.filter( isDebt ).reduce( ( s, a ) => s + a.balance, 0 );
    const groups = ( Object.keys( ACCOUNT_GROUPS ) as ( keyof typeof ACCOUNT_GROUPS )[] )
        .map( g => ( { key: g, label: ACCOUNT_GROUPS[ g ], items: live.filter( a => ACCOUNT_TYPES[ a.type ].group === g ) } ) )
        .filter( g => g.items.length );
    const spark = ( id: string ) => movements.filter( m => m.accountId === id ).slice( -12 ).map( m => m.balanceAfter );

    return (
        <>
            <PageHeader title="Accounts" subtitle={ <>{ inr( total ) } across { live.length } account{ live.length === 1 ? "" : "s" }{ owed > 0 && <> · { inrCompact( owed ) } owed</> }</> }
                action={ <AddAccountButton goals={ goalOpts } /> } />
            { live.length === 0 && (
                <Empty icon={ <Landmark size={ 36 } /> } title="No accounts yet" body="Add your savings account, each FD or RD, your SIPs and your credit card. One deposit per goal keeps it clean." action={ <AddAccountButton goals={ goalOpts } /> } />
            ) }
            { groups.map( g => (
                <Section key={ g.key } title={ g.label }>
                    <ul className="card divide-y divide-border">
                        { g.items.map( a => {
                            const b = bucketOf( a );
                            const gain = gainOf( a );
                            return (
                                <li key={ a.id }>
                                    <NavLink to={ { tab: "money", id: a.id } } className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                                        <span className="h-9 w-1 shrink-0 rounded-full" style={ { background: b === "debt" ? "var(--status-critical)" : BUCKETS[ b ].color } } />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-medium">{ a.name }</span>
                                                <Badge className="shrink-0 whitespace-nowrap">{ ACCOUNT_TYPES[ a.type ].short }</Badge>
                                            </div>
                                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                { a.goal ? <>→ { a.goal.name }</> : b === "debt" ? "Owed" : BUCKETS[ b ].label }
                                                { a.maturityDate && <> · matures { relativeDays( a.maturityDate ) }</> }
                                                { a.sipAmount ? <> · { inrCompact( a.sipAmount ) }/mo</> : null }
                                            </div>
                                        </div>
                                        <div className="hidden sm:block"><Sparkline data={ spark( a.id ) } color={ b === "debt" ? "var(--status-critical)" : BUCKETS[ b ].color } /></div>
                                        <div className="text-right">
                                            <div className={ `tabular font-semibold ${b === "debt" ? "text-status-critical-text" : ""}` }>{ b === "debt" && a.balance > 0 ? "−" : "" }{ inr( a.balance ) }</div>
                                            { gain != null && gain !== 0 && a.invested ? <div className={ `text-xs tabular ${gain >= 0 ? "text-status-good-text" : "text-status-critical-text"}` }>{ inrDelta( gain ) }</div> : null }
                                        </div>
                                        <ChevronRight size={ 16 } className="shrink-0 text-muted-foreground/45" />
                                    </NavLink>
                                </li>
                            );
                        } ) }
                    </ul>
                </Section>
            ) ) }
            { archived.length > 0 && (
                <Section title="Archived">
                    <ul className="card divide-y divide-border opacity-70">
                        { archived.map( a => (
                            <li key={ a.id }><NavLink to={ { tab: "money", id: a.id } } className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/60"><span>{ a.name }</span><span className="tabular text-muted-foreground">{ inr( a.balance ) }</span></NavLink></li>
                        ) ) }
                    </ul>
                </Section>
            ) }
        </>
    );
}

function LoanRow( { l }: { l: LoanWithPayments } ) {
    const out = loanOutstanding( l );
    const paid = loanPaid( l );
    const pctPaid = l.principal > 0 ? paid / l.principal : 0;
    const lent = l.direction === "LENT";
    const overdue = l.status === "ACTIVE" && l.dueDate && daysBetween( new Date(), l.dueDate ) < 0;
    return (
        <li>
            <NavLink to={ { tab: "money", sub: "loans", id: l.id } } className="block px-4 py-3 hover:bg-muted/60">
                <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{ l.counterparty }{ l.purpose && <span className="font-normal text-muted-foreground"> · { l.purpose }</span> }</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                            <span>{ inrCompact( l.principal ) } { lent ? "lent" : "borrowed" } { fmtDate( l.startDate, { month: "short", year: "numeric" } ) }</span>
                            { l.dueDate && l.status === "ACTIVE" && ( overdue ? <Status tone="critical">overdue</Status> : <span>· due { relativeDays( l.dueDate ) }</span> ) }
                            { l.emi ? <span>· EMI { inrCompact( l.emi ) }</span> : null }
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={ `tabular font-semibold ${l.status === "CLOSED" ? "text-muted-foreground/75 line-through" : lent ? "text-status-good-text" : "text-status-critical-text"}` }>{ inr( out ) }</div>
                        <div className="text-xs text-muted-foreground">{ l.status === "CLOSED" ? "settled" : "outstanding" }</div>
                    </div>
                    <ChevronRight size={ 16 } className="text-muted-foreground/45" />
                </div>
                { l.status === "ACTIVE" && <Meter value={ pctPaid } className="mt-2.5" height={ 5 } color={ lent ? "var(--viz-5)" : "var(--viz-8)" } /> }
            </NavLink>
        </li>
    );
}

function Loans() {
    const { data: { loans, goals } } = useData();
    const goalOpts = goals.filter( g => g.status === "ACTIVE" ).map( g => ( { id: g.id, name: g.name, emoji: g.emoji } ) );
    const active = loans.filter( l => l.status === "ACTIVE" );
    const lent = active.filter( l => l.direction === "LENT" );
    const borrowed = active.filter( l => l.direction === "BORROWED" );
    const closed = loans.filter( l => l.status === "CLOSED" );
    const owedToMe = lent.reduce( ( s, l ) => s + loanOutstanding( l ), 0 );
    const iOwe = borrowed.reduce( ( s, l ) => s + loanOutstanding( l ), 0 );
    return (
        <>
            <PageHeader title="Loans" subtitle="Who owes whom." action={ <AddLoanButton goals={ goalOpts } /> } />
            { loans.length === 0 ? (
                <Empty icon={ <HandCoins size={ 36 } /> } title="No loans tracked" body="Money you lent a friend, an EMI you're paying, cash from Dad — track it here so net worth stays honest." action={ <AddLoanButton goals={ goalOpts } /> } />
            ) : (
                <div className="mb-6 grid grid-cols-2 gap-3">
                    <Stat label="Owed to you" value={ <span className="text-status-good-text">{ inr( owedToMe ) }</span> } sub={ `${lent.length} active` } />
                    <Stat label="You owe" value={ <span className={ iOwe > 0 ? "text-status-critical-text" : "" }>{ inr( iOwe ) }</span> } sub={ `${borrowed.length} active` } />
                </div>
            ) }
            { lent.length > 0 && <Section title="Lent out"><ul className="card divide-y divide-border">{ lent.map( l => <LoanRow key={ l.id } l={ l } /> ) }</ul></Section> }
            { borrowed.length > 0 && <Section title="Borrowed"><ul className="card divide-y divide-border">{ borrowed.map( l => <LoanRow key={ l.id } l={ l } /> ) }</ul></Section> }
            { closed.length > 0 && <Section title="Settled"><ul className="card divide-y divide-border opacity-70">{ closed.map( l => <LoanRow key={ l.id } l={ l } /> ) }</ul></Section> }
        </>
    );
}
