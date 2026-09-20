"use client";

import { HandCoins, ChevronRight } from "lucide-react";
import { useData } from "@/components/shell/data-provider";
import { loanLeft, loanPaid, type LoanLike as LoanWithPayments } from "@/lib/derive";
import { NavLink } from "@/lib/view";
import { inr, inrCompact, relativeDays, daysBetween } from "@/lib/money";
import { PageHeader, Section, Empty } from "@/components/ui/page";
import { Meter } from "@/components/ui/meter";
import { Badge } from "@/components/ui/badge";
import { AddLoanButton } from "@/components/loans/loan-sheets";
import { List, Item } from "@/components/shell/motion";

function Row( { l }: { l: LoanWithPayments } ) {
    const left = loanLeft( l );
    const paid = loanPaid( l );
    const lent = l.direction === "LENT";
    const late = !l.closed && l.endDate && daysBetween( new Date(), l.endDate ) < 0;
    return (
        <Item>
            <NavLink to={ { tab: "loans", id: l.id } } className={ `card block border-l-4 p-4 ${l.closed ? "border-l-transparent" : lent ? "border-l-status-good" : "border-l-loan"}` }>
                <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="truncate font-medium">{ l.name }</span><Badge tone={ l.closed ? "neutral" : lent ? "good" : "warning" }>{ l.closed ? "settled" : lent ? "owes me" : "I owe" }</Badge></div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                            { inrCompact( paid ) } of { inrCompact( l.amount ) } paid{ l.endDate && !l.closed && <> · { late ? <span className="text-status-critical-text">was due { relativeDays( l.endDate ) }</span> : `due ${relativeDays( l.endDate )}` }</> }
                        </div>
                    </div>
                    <div className={ `tabular text-lg font-semibold ${l.closed ? "text-muted-foreground/75" : lent ? "text-status-good-text" : "text-loan"}` }>{ inr( left ) }</div>
                    <ChevronRight size={ 16 } className="text-muted-foreground/45" />
                </div>
                { !l.closed && <Meter value={ l.amount ? paid / l.amount : 0 } className="mt-3" height={ 6 } color={ lent ? "var(--status-good)" : "var(--loan)" } /> }
            </NavLink>
        </Item>
    );
}

export function LoansView() {
    const { data: { loans } } = useData();
    const open = loans.filter( l => !l.closed );
    const closed = loans.filter( l => l.closed );
    const owe = open.filter( l => l.direction === "BORROWED" ).reduce( ( s, l ) => s + loanLeft( l ), 0 );
    const owed = open.filter( l => l.direction === "LENT" ).reduce( ( s, l ) => s + loanLeft( l ), 0 );
    return (
        <div>
            <PageHeader title="Loans" subtitle={ loans.length ? <>{ owe > 0 && <>you owe { inrCompact( owe ) }</> }{ owe > 0 && owed > 0 && " · " }{ owed > 0 && <>owed to you { inrCompact( owed ) }</> }{ !owe && !owed && "All settled." }</> : "Who owes whom." } action={ <AddLoanButton /> } />
            { loans.length === 0 && <Empty icon={ <HandCoins size={ 36 } /> } title="No loans" body="Money you took or gave. Tap one to record what's been paid." action={ <AddLoanButton /> } /> }
            { open.length > 0 && <List className="mb-6 grid gap-2">{ open.map( l => <Row key={ l.id } l={ l } /> ) }</List> }
            { closed.length > 0 && <Section title="Settled"><List className="grid gap-2 opacity-70">{ closed.map( l => <Row key={ l.id } l={ l } /> ) }</List></Section> }
        </div>
    );
}
