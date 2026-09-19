"use client";

import { useData } from "@/components/shell/data-provider";
import { loanOutstanding, loanPaid } from "@/lib/finance";
import { LOAN_DIRECTIONS } from "@/lib/constants";
import { fmtDate, inr, relativeDays, daysBetween } from "@/lib/money";
import { PageHeader, Section, Stat, Empty } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { Status } from "@/components/ui/status";
import { AddPaymentButton, DeletePaymentButton, EditLoanButton, LoanActions } from "@/components/loans/loan-sheets";

export function LoanDetailView( { id }: { id: string } ) {
    const { data: all } = useData();
    const loan = all.loans.find( l => l.id === id );
    if ( !loan ) return <div><PageHeader back={ { tab: "money", sub: "loans" } } title="Loan" /><Empty title="This loan no longer exists" /></div>;
    const goalOpts = all.goals.filter( g => g.status === "ACTIVE" ).map( g => ( { id: g.id, name: g.name, emoji: g.emoji } ) );
    const out = loanOutstanding( loan );
    const paid = loanPaid( loan );
    const lent = loan.direction === "LENT";
    const overdue = loan.status === "ACTIVE" && loan.dueDate && daysBetween( new Date(), loan.dueDate ) < 0;
    const monthsToClear = loan.emi && out > 0 ? Math.ceil( out / loan.emi ) : null;

    return (
        <div>
            <PageHeader back={ { tab: "money", sub: "loans" } } title={ loan.counterparty }
                subtitle={ <span className="flex flex-wrap items-center gap-1.5"><Badge tone={ lent ? "good" : "critical" }>{ LOAN_DIRECTIONS[ loan.direction ].label }</Badge>{ loan.purpose && <Badge>{ loan.purpose }</Badge> }<Badge tone={ loan.status === "CLOSED" ? "neutral" : "info" }>{ loan.status.toLowerCase() }</Badge></span> }
                action={ <EditLoanButton loan={ loan } goals={ goalOpts } /> } />

            <div className="card p-5">
                <div className="text-xs text-muted-foreground">{ lent ? "They still owe you" : "You still owe" }</div>
                <div className={ `mt-1 text-4xl font-semibold tracking-tight ${loan.status === "CLOSED" ? "text-muted-foreground/75" : lent ? "text-status-good-text" : "text-status-critical-text"}` }>{ inr( out ) }</div>
                <Meter value={ loan.principal ? paid / loan.principal : 0 } className="mt-4" height={ 8 } color={ lent ? "var(--viz-5)" : "var(--viz-8)" } />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>{ inr( paid ) } of { inr( loan.principal ) } repaid</span>
                    { loan.dueDate && loan.status === "ACTIVE" && ( overdue ? <Status tone="critical">Overdue since { fmtDate( loan.dueDate ) }</Status> : <Status tone="neutral" icon="clock">Due { relativeDays( loan.dueDate ) }</Status> ) }
                </div>
                { loan.status === "ACTIVE" && <div className="mt-4"><AddPaymentButton loan={ loan } outstanding={ out } /></div> }
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat label="Given on" value={ fmtDate( loan.startDate ) } />
                { loan.interestRate ? <Stat label="Interest" value={ `${loan.interestRate}% p.a.` } sub={ `≈ ${inr( Math.round( out * loan.interestRate / 100 / 12 ) )}/mo on outstanding` } /> : <Stat label="Interest" value="None" /> }
                { loan.emi ? <Stat label="EMI" value={ inr( loan.emi ) } sub={ monthsToClear ? `${monthsToClear} more month${monthsToClear === 1 ? "" : "s"}` : undefined } /> : null }
                { loan.closedAt && <Stat label="Settled on" value={ fmtDate( loan.closedAt ) } /> }
            </div>

            { loan.note && <p className="mt-4 rounded-xl bg-card px-4 py-3 text-sm text-foreground/75 ring-1 ring-border">{ loan.note }</p> }

            <Section title="Repayments" className="mt-6">
                { loan.payments.length === 0 ? <div className="card p-4 text-sm text-muted-foreground">No repayments yet.</div> : (
                    <ul className="card divide-y divide-border">
                        { loan.payments.map( p => (
                            <li key={ p.id } className="flex items-center gap-3 px-4 py-2.5 text-sm">
                                <div className="min-w-0 flex-1"><div className="font-medium">{ p.note || "Repayment" }</div><div className="text-xs text-muted-foreground">{ fmtDate( p.date ) }</div></div>
                                <div className="tabular font-medium">{ inr( p.amount ) }</div>
                                <DeletePaymentButton id={ p.id } />
                            </li>
                        ) ) }
                    </ul>
                ) }
            </Section>

            <Section title="Manage"><LoanActions loan={ loan } /></Section>
        </div>
    );
}
