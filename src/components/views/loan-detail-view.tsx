"use client";

import { useData } from "@/components/shell/data-provider";
import { loanLeft, loanPaid } from "@/lib/derive";
import { fmtDate, inr, relativeDays, daysBetween } from "@/lib/money";
import { PageHeader, Section, Empty } from "@/components/ui/page";
import { Meter } from "@/components/ui/meter";
import { Badge } from "@/components/ui/badge";
import { AddPaymentButton, DeletePaymentButton, EditLoanButton } from "@/components/loans/loan-sheets";
import { Count, List, Item, Rise } from "@/components/shell/motion";
import { AnimatePresence } from "motion/react";

export function LoanDetailView( { id }: { id: string } ) {
    const { data: { loans } } = useData();
    const loan = loans.find( l => l.id === id );
    if ( !loan ) return <div><PageHeader back={ { tab: "loans" } } title="Loan" /><Empty title="This loan no longer exists" /></div>;
    const left = loanLeft( loan );
    const paid = loanPaid( loan );
    const lent = loan.direction === "LENT";
    const late = !loan.closed && loan.endDate && daysBetween( new Date(), loan.endDate ) < 0;

    return (
        <div>
            <PageHeader back={ { tab: "loans" } } title={ loan.name }
                subtitle={ <span className="flex flex-wrap items-center gap-1.5"><Badge tone={ loan.closed ? "neutral" : lent ? "good" : "warning" }>{ loan.closed ? "settled" : lent ? "owes me" : "I owe" }</Badge>{ loan.note && <span className="text-muted-foreground">{ loan.note }</span> }</span> }
                action={ <EditLoanButton loan={ loan } /> } />

            <Rise className={ `card border-t-4 p-5 ${loan.closed ? "border-t-transparent" : lent ? "border-t-status-good" : "border-t-loan"}` }>
                <div className="text-xs text-muted-foreground">{ loan.closed ? "Settled" : lent ? "Still owed to me" : "Still owe" }</div>
                <div className={ `mt-1 text-[40px] font-semibold leading-none tracking-tight tabular ${loan.closed ? "text-muted-foreground/75" : lent ? "text-status-good-text" : "text-loan"}` }><Count value={ left } /></div>
                <Meter value={ loan.amount ? paid / loan.amount : 0 } className="mt-4" height={ 10 } color={ lent ? "var(--status-good)" : "var(--loan)" } />
                <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>{ inr( paid ) } of { inr( loan.amount ) }</span>
                    { loan.endDate && !loan.closed && <span className={ late ? "text-status-critical-text" : "" }>{ late ? "Was due" : "Due" } { fmtDate( loan.endDate ) } · { relativeDays( loan.endDate ) }</span> }
                </div>
                { !loan.closed && <div className="mt-4"><AddPaymentButton loan={ loan } left={ left } /></div> }
            </Rise>

            <Section title="Payments" className="mt-6">
                { loan.payments.length === 0 ? <div className="card px-4 py-5 text-center text-sm text-muted-foreground">Nothing paid yet.</div> : (
                    <List className="card divide-y divide-border">
                        <AnimatePresence initial={ false }>
                        { loan.payments.map( p => (
                            <Item key={ p.id } className="flex items-center gap-3 px-4 py-3 text-sm">
                                <div className="min-w-0 flex-1"><div className="truncate font-medium">{ p.note || "Payment" }</div><div className="text-xs text-muted-foreground">{ fmtDate( p.date ) }</div></div>
                                <div className="tabular font-semibold">{ inr( p.amount ) }</div>
                                <DeletePaymentButton id={ p.id } />
                            </Item>
                        ) ) }
                        </AnimatePresence>
                    </List>
                ) }
            </Section>
        </div>
    );
}
