"use client";

import { useData } from "@/components/shell/data-provider";
import { fmtDate, inr, inrCompact } from "@/lib/money";
import { PageHeader, Section, Empty } from "@/components/ui/page";
import { Meter } from "@/components/ui/meter";
import { DeleteEntryButton, EditFundButton, EntryButtons } from "@/components/funds/fund-sheets";
import { Count, List, Item, Rise } from "@/components/shell/motion";
import { AnimatePresence } from "motion/react";

export function FundDetailView( { id }: { id: string } ) {
    const { data: { funds } } = useData();
    const fund = funds.find( f => f.id === id );
    if ( !fund ) return <div><PageHeader back={ { tab: "funds" } } title="Fund" /><Empty title="This fund no longer exists" /></div>;
    const pct = fund.target > 0 ? fund.balance / fund.target : 0;
    const full = fund.target > 0 && fund.balance >= fund.target;
    const left = Math.max( 0, fund.target - fund.balance );

    return (
        <div>
            <PageHeader back={ { tab: "funds" } } title={ `${fund.emoji ? `${fund.emoji} ` : ""}${fund.name}` } subtitle={ fund.note ?? undefined } action={ <EditFundButton fund={ fund } /> } />

            <Rise className="card border-t-4 border-t-fund p-5">
                <div className="text-xs text-muted-foreground">In it now</div>
                <div className="mt-1 text-[40px] font-semibold leading-none tracking-tight tabular"><Count value={ fund.balance } /></div>
                { fund.target > 0 && (
                    <>
                        <Meter value={ pct } className="mt-4" height={ 10 } color={ full ? "var(--status-good)" : "var(--fund)" } />
                        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                            <span>{ Math.round( pct * 100 ) }% of { inr( fund.target ) }</span>
                            <span>{ full ? "Full" : `${inrCompact( left )} to go` }</span>
                        </div>
                    </>
                ) }
                <div className="mt-4"><EntryButtons fund={ fund } /></div>
            </Rise>

            <Section title="History" className="mt-6">
                { fund.entries.length === 0 ? <div className="card px-4 py-5 text-center text-sm text-muted-foreground">Nothing yet. Tap Put in.</div> : (
                    <List className="card divide-y divide-border">
                        <AnimatePresence initial={ false }>
                        { fund.entries.map( e => (
                            <Item key={ e.id } className="flex items-center gap-3 px-4 py-3 text-sm">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{ e.note || ( e.amount > 0 ? "Put in" : "Taken out" ) }</div>
                                    <div className="text-xs text-muted-foreground">{ fmtDate( e.date ) }</div>
                                </div>
                                <div className={ `tabular font-semibold ${e.amount > 0 ? "text-status-good-text" : "text-status-critical-text"}` }>{ e.amount > 0 ? "+" : "−" }{ inr( Math.abs( e.amount ) ) }</div>
                                <DeleteEntryButton id={ e.id } />
                            </Item>
                        ) ) }
                        </AnimatePresence>
                    </List>
                ) }
            </Section>
        </div>
    );
}
