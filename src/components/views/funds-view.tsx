"use client";

import { PiggyBank, ChevronRight } from "lucide-react";
import { useData } from "@/components/shell/data-provider";
import { NavLink } from "@/lib/view";
import { inr, inrCompact } from "@/lib/money";
import { PageHeader, Empty } from "@/components/ui/page";
import { Meter } from "@/components/ui/meter";
import { AddFundButton } from "@/components/funds/fund-sheets";
import { List, Item } from "@/components/shell/motion";

export function FundsView() {
    const { data: { funds } } = useData();
    const total = funds.reduce( ( s, f ) => s + f.balance, 0 );
    return (
        <div>
            <PageHeader title="Funds" subtitle={ funds.length ? `${inr( total )} set aside` : "Money with a name on it." } action={ <AddFundButton /> } />
            { funds.length === 0 ? (
                <Empty icon={ <PiggyBank size={ 36 } /> } title="No funds yet" body="Emergency, a trip, a phone. Add a target, then tap it to record what goes in." action={ <AddFundButton /> } />
            ) : (
                <List className="grid gap-2">
                    { funds.map( f => {
                        const pct = f.target > 0 ? f.balance / f.target : 0;
                        const full = f.target > 0 && f.balance >= f.target;
                        return (
                            <Item key={ f.id }>
                                <NavLink to={ { tab: "funds", id: f.id } } className="card block p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fund-soft text-2xl">{ f.emoji ?? "💰" }</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium">{ f.name }</div>
                                            <div className="text-xs text-muted-foreground">{ f.target > 0 ? `${Math.round( pct * 100 )}% of ${inrCompact( f.target )}` : "No target" }</div>
                                        </div>
                                        <div className="text-right"><div className={ `tabular text-lg font-semibold ${full ? "text-status-good-text" : ""}` }>{ inr( f.balance ) }</div></div>
                                        <ChevronRight size={ 16 } className="text-muted-foreground/45" />
                                    </div>
                                    { f.target > 0 && <Meter value={ pct } className="mt-3" height={ 6 } color={ full ? "var(--status-good)" : "var(--fund)" } /> }
                                </NavLink>
                            </Item>
                        );
                    } ) }
                </List>
            ) }
        </div>
    );
}
