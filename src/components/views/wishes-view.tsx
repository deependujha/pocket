"use client";

import { useState } from "react";
import { Gift, Link2 } from "lucide-react";
import type { Wish } from "@/generated/prisma/client";
import { useData } from "@/components/shell/data-provider";
import { inr, inrCompact, hostOf } from "@/lib/money";
import { PageHeader, Section, Empty } from "@/components/ui/page";
import { AddSectionButton, AddWishButton, SectionMenu, WishSheet } from "@/components/wishes/wish-sheets";
import { cn } from "@/lib/utils";
import { List, Item, Rise } from "@/components/shell/motion";
import { AnimatePresence } from "motion/react";

export function WishesView() {
    const { data: { sections } } = useData();
    const [ editing, setEditing ] = useState<Wish | null>( null );
    const plain = sections.map( s => ( { id: s.id, userId: s.userId, name: s.name, emoji: s.emoji, order: s.order, createdAt: s.createdAt } ) );
    const total = sections.flatMap( s => s.wishes ).filter( w => !w.done ).reduce( ( a, w ) => a + w.amount, 0 );

    return (
        <div>
            <PageHeader title="Wishes" subtitle={ total > 0 ? `${inr( total )} still to get` : "Things to get, for people you love." }
                action={ <div className="flex gap-2">{ sections.length > 0 && <AddWishButton sections={ plain } /> }<AddSectionButton variant={ sections.length ? "outline" : "default" } /></div> } />

            { sections.length === 0 && (
                <Empty icon={ <Gift size={ 36 } /> } title="No sections yet" body="Make one for Mom, one for Dad, one for you. Then add wishes inside." action={ <AddSectionButton /> } />
            ) }

            { sections.map( ( s, i ) => (
                <Rise key={ s.id } delay={ i * 0.05 }><Section title={ <span className="normal-case tracking-normal text-base font-semibold text-foreground">{ s.emoji ? `${s.emoji} ` : "" }{ s.name }</span> }
                    action={ <div className="flex items-center gap-0.5"><AddWishButton sections={ plain } sectionId={ s.id } small /><SectionMenu section={ s } /></div> }>
                    { s.wishes.length === 0 ? (
                        <div className="card border-dashed px-4 py-5 text-center text-sm text-muted-foreground">Nothing here yet. Tap + to add one.</div>
                    ) : (
                        <List className="grid gap-2">
                            <AnimatePresence initial={ false }>
                            { s.wishes.map( w => (
                                <Item key={ w.id }>
                                    <button type="button" onClick={ () => setEditing( w ) } className={ cn( "card w-full border-l-4 p-4 text-left", w.done ? "border-l-transparent opacity-55" : "border-l-wish" ) }>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className={ cn( "font-medium leading-snug", w.done && "line-through" ) }>{ w.name }</div>
                                                { w.note && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{ w.note }</p> }
                                            </div>
                                            <div className={ cn( "shrink-0 tabular text-lg font-semibold", !w.done && "text-wish" ) }>{ w.amount ? inrCompact( w.amount ) : "" }</div>
                                        </div>
                                        { w.links.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                { w.links.map( l => (
                                                    <a key={ l } href={ l } target="_blank" rel="noreferrer" onClick={ e => e.stopPropagation() }
                                                        className="inline-flex items-center gap-1 rounded-full bg-wish-soft px-2 py-0.5 text-[11px] font-medium text-wish">
                                                        <Link2 size={ 11 } /> { hostOf( l ) }
                                                    </a>
                                                ) ) }
                                            </div>
                                        ) }
                                    </button>
                                </Item>
                            ) ) }
                            </AnimatePresence>
                        </List>
                    ) }
                </Section></Rise>
            ) ) }

            { editing && <WishSheet wish={ editing } sections={ plain } open onOpenChange={ o => { if ( !o ) setEditing( null ); } } /> }
        </div>
    );
}
