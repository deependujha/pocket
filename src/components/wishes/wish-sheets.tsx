"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, RotateCcw, FolderPlus } from "lucide-react";
import type { Wish, WishSection } from "@/generated/prisma/client";
import { deleteSection, deleteWish, saveSection, saveWish, setWishDone } from "@/actions/wishes";
import type { ActionResult } from "@/actions/_shared";
import { useRefresh, usePatch } from "@/components/shell/data-provider";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AmountInput, Field, FormError, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { celebrate, buzz } from "@/lib/fx";

/* ---------- sections ---------- */

function SectionForm( { section, onDone }: { section?: WishSection; onDone: () => void } ) {
    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await saveSection( section?.id ?? null, prev, fd );
        if ( r.ok ) { toast.success( section ? "Renamed" : "Section added" ); refresh(); onDone(); }
        return r;
    }, null );
    return (
        <form action={ action } className="space-y-4">
            <div className="flex gap-3">
                <Field label="Icon" className="w-20"><input name="emoji" defaultValue={ section?.emoji ?? "" } placeholder="🎁" maxLength={ 4 } className={ `${inputCls} text-center text-xl` } /></Field>
                <Field label="Name" className="flex-1"><input name="name" defaultValue={ section?.name ?? "" } placeholder="Mom, Dad, Me, Home" required autoFocus className={ inputCls } /></Field>
            </div>
            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>{ section ? "Save" : "Add section" }</SubmitButton>
        </form>
    );
}

export function AddSectionButton( { variant = "default" }: { variant?: "default" | "outline" } ) {
    const [ open, setOpen ] = useState( false );
    return (
        <>
            <Button size="sm" variant={ variant } className="rounded-full" onClick={ () => setOpen( true ) }><FolderPlus size={ 16 } /> Section</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="New section" description="Who or what is this for?">
                <SectionForm onDone={ () => setOpen( false ) } />
            </Sheet>
        </>
    );
}

export function SectionMenu( { section }: { section: WishSection } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <button type="button" onClick={ () => setOpen( true ) } className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={ `Edit ${section.name}` }><Pencil size={ 14 } /></button>
            <Sheet open={ open } onOpenChange={ setOpen } title={ section.name }>
                <SectionForm section={ section } onDone={ () => setOpen( false ) } />
                <Button variant="outline" className="mt-3 w-full rounded-xl text-status-critical-text" onClick={ async () => {
                    if ( confirm( `Delete "${section.name}" and everything in it?` ) ) { await deleteSection( section.id ); setOpen( false ); refresh(); }
                } }><Trash2 size={ 15 } /> Delete section</Button>
            </Sheet>
        </>
    );
}

/* ---------- wishes ---------- */

function WishForm( { wish, sections, sectionId, onDone }: { wish?: Wish; sections: WishSection[]; sectionId?: string; onDone: () => void } ) {
    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await saveWish( wish?.id ?? null, prev, fd );
        if ( r.ok ) { toast.success( wish ? "Saved" : "Wish added" ); refresh(); onDone(); }
        return r;
    }, null );
    return (
        <form action={ action } className="space-y-4">
            <Field label="Name"><input name="name" defaultValue={ wish?.name ?? "" } placeholder="iPhone 17, Goa trip, sofa" required autoFocus className={ inputCls } /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Expected amount"><AmountInput name="amount" defaultValue={ wish?.amount ?? null } /></Field>
                <Field label="Section">
                    <Select name="sectionId" defaultValue={ wish?.sectionId ?? sectionId ?? sections[ 0 ]?.id }>
                        { sections.map( s => <option key={ s.id } value={ s.id }>{ s.emoji ? `${s.emoji} ` : "" }{ s.name }</option> ) }
                    </Select>
                </Field>
            </div>
            <Field label="Links" hint="One per line"><Textarea name="links" defaultValue={ wish?.links.join( "\n" ) ?? "" } rows={ 2 } placeholder="amazon.in/…" className="min-h-14" /></Field>
            <Field label="Note"><Textarea name="note" defaultValue={ wish?.note ?? "" } rows={ 2 } className="min-h-14" placeholder="Colour, size, why" /></Field>
            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton className="btn-wish">{ wish ? "Save" : "Add wish" }</SubmitButton>
        </form>
    );
}

export function AddWishButton( { sections, sectionId, small }: { sections: WishSection[]; sectionId?: string; small?: boolean } ) {
    const [ open, setOpen ] = useState( false );
    return (
        <>
            { small
                ? <button type="button" onClick={ () => setOpen( true ) } className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Add wish"><Plus size={ 16 } /></button>
                : <Button size="sm" className="btn-wish rounded-full" onClick={ () => setOpen( true ) }><Plus size={ 16 } /> Wish</Button> }
            <Sheet open={ open } onOpenChange={ setOpen } title="New wish">
                <WishForm sections={ sections } sectionId={ sectionId } onDone={ () => setOpen( false ) } />
            </Sheet>
        </>
    );
}

export function WishSheet( { wish, sections, open, onOpenChange }: { wish: Wish; sections: WishSection[]; open: boolean; onOpenChange: ( o: boolean ) => void } ) {
    const refresh = useRefresh();
    const patch = usePatch();
    return (
        <Sheet open={ open } onOpenChange={ onOpenChange } title={ wish.name }>
            <WishForm wish={ wish } sections={ sections } onDone={ () => onOpenChange( false ) } />
            <div className="mt-3 flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={ async () => {
                    const done = !wish.done;
                    if ( done ) celebrate(); else buzz();
                    onOpenChange( false );
                    patch( d => ( { ...d, sections: d.sections.map( s => ( { ...s, wishes: s.wishes.map( w => w.id === wish.id ? { ...w, done } : w ) } ) ) } ) );
                    await setWishDone( wish.id, done ); refresh();
                } }>
                    { wish.done ? <><RotateCcw size={ 15 } /> Not yet</> : <><Check size={ 15 } /> Got it</> }
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl text-status-critical-text" onClick={ async () => { if ( confirm( `Delete "${wish.name}"?` ) ) { await deleteWish( wish.id ); onOpenChange( false ); refresh(); } } }>
                    <Trash2 size={ 15 } /> Delete
                </Button>
            </div>
        </Sheet>
    );
}
