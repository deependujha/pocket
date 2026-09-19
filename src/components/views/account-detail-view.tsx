"use client";

import { useData } from "@/components/shell/data-provider";
import { NavLink } from "@/lib/view";
import { ACCOUNT_TYPES, BUCKETS, LIQUIDITY, MOVEMENT_KINDS } from "@/lib/constants";
import { balanceHistory, bucketOf, fdAccruedValue, fdMaturityValue, gainOf, isDebt } from "@/lib/finance";
import { fmtDate, inr, inrCompact, inrDelta, relativeDays, daysBetween } from "@/lib/money";
import { PageHeader, Section, Stat, Empty } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { TrendArea } from "@/components/charts/area-chart";
import { AccountDangerZone, EditAccountButton, UpdateBalanceButton } from "@/components/accounts/account-sheets";
import { DeleteMovementButton } from "@/components/accounts/movement-row";

export function AccountDetailView( { id }: { id: string } ) {
    const { data: all } = useData();
    const account = all.accounts.find( a => a.id === id );
    if ( !account ) return <div><PageHeader back={ { tab: "money" } } title="Account" /><Empty title="This account no longer exists" /></div>;
    const movements = all.movements.filter( m => m.accountId === id );
    const goalOpts = all.goals.filter( g => g.status === "ACTIVE" ).map( g => ( { id: g.id, name: g.name, emoji: g.emoji } ) );
    const meta = ACCOUNT_TYPES[ account.type ];
    const b = bucketOf( account );
    const color = b === "debt" ? "var(--status-critical)" : BUCKETS[ b ].color;
    const history = balanceHistory( movements, [ id ] );
    const gain = gainOf( account );
    const principal = account.invested ?? account.balance;
    const fd = meta.hasMaturity && account.interestRate && account.startDate && account.maturityDate
        ? { maturity: fdMaturityValue( principal, account.interestRate, account.startDate, account.maturityDate ), accrued: fdAccruedValue( principal, account.interestRate, account.startDate, account.maturityDate ) }
        : null;

    return (
        <div>
            <PageHeader back={ { tab: "money" } } title={ account.name }
                subtitle={ <span className="flex flex-wrap items-center gap-1.5"><Badge>{ meta.label }</Badge>{ account.institution && <Badge>{ account.institution }</Badge> }<Badge>{ LIQUIDITY[ account.liquidity ].label }</Badge>{ account.archived && <Badge tone="warning">Archived</Badge> }</span> }
                action={ <EditAccountButton account={ account } goals={ goalOpts } /> } />

            <div className="card p-5">
                <div className="text-xs text-muted-foreground">{ isDebt( account ) ? "Amount owed" : "Current value" }</div>
                <div className={ `mt-1 text-4xl font-semibold tracking-tight ${isDebt( account ) && account.balance > 0 ? "text-status-critical-text" : ""}` }>{ inr( account.balance ) }</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    { account.goal ? <NavLink to={ { tab: "goals", id: account.goal.id } } className="underline-offset-2 hover:underline">Funds “{ account.goal.name }”</NavLink> : b === "debt" ? "Counts against net worth" : <span>{ BUCKETS[ b ].label } · { BUCKETS[ b ].hint }</span> }
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <UpdateBalanceButton account={ account } />
                </div>
            </div>

            { ( gain != null || fd || account.sipAmount ) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                    { gain != null && account.invested != null && <Stat label="Invested" value={ inr( account.invested ) } sub={ <span className={ gain >= 0 ? "text-status-good-text" : "text-status-critical-text" }>{ inrDelta( gain ) } ({ account.invested > 0 ? `${( ( gain / account.invested ) * 100 ).toFixed( 1 )}%` : "—" })</span> } /> }
                    { account.sipAmount ? <Stat label="Monthly contribution" value={ inr( account.sipAmount ) } sub={ account.sipDay ? `On the ${account.sipDay}th` : undefined } /> : null }
                    { fd && account.maturityDate && <Stat label="At maturity" value={ inr( fd.maturity ) } sub={ `${fmtDate( account.maturityDate )} · ${relativeDays( account.maturityDate )}` } /> }
                    { fd && account.maturityDate && daysBetween( new Date(), account.maturityDate ) > 0 && <Stat label="Accrued so far" value={ inr( fd.accrued ) } sub={ `${account.interestRate}% p.a. · ${fd.accrued !== account.balance ? `balance is ${inrDelta( account.balance - fd.accrued )} off` : "matches balance"}` } /> }
                </div>
            ) }

            { account.note && <p className="mt-4 rounded-xl bg-card px-4 py-3 text-sm text-foreground/75 ring-1 ring-border">{ account.note }</p> }

            <Section title="Balance over time" className="mt-6">
                <div className="card p-4 pl-3"><TrendArea data={ history } color={ color } id={ `acc-${id}` } /></div>
            </Section>

            <Section title="History" hint="Newest first">
                <ul className="card divide-y divide-border">
                    { [ ...movements ].reverse().map( m => (
                        <li key={ m.id } className="flex items-center gap-3 px-4 py-2.5 text-sm">
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">{ m.note || MOVEMENT_KINDS[ m.kind ].label }</div>
                                <div className="text-xs text-muted-foreground">{ fmtDate( m.date ) }{ m.note ? ` · ${MOVEMENT_KINDS[ m.kind ].label}` : "" } · after { inrCompact( m.balanceAfter ) }</div>
                            </div>
                            <div className={ `tabular font-medium ${m.amount > 0 ? "text-status-good-text" : m.amount < 0 ? "text-status-critical-text" : "text-muted-foreground"}` }>{ inrDelta( m.amount ) }</div>
                            <DeleteMovementButton id={ m.id } />
                        </li>
                    ) ) }
                </ul>
            </Section>

            <Section title="Manage">
                <AccountDangerZone account={ account } />
            </Section>
        </div>
    );
}
