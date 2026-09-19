"use client";

/**
 * Client-side "routing" for the single-page shell.
 * The view lives in the URL (?tab=goals&id=…) so back/forward and reloads work,
 * but switching never asks the server for anything: we use the native History API,
 * which Next syncs into useSearchParams without a navigation.
 */
import { useSearchParams } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export type Tab = "overview" | "plan" | "goals" | "money" | "more";
export type MoneySub = "accounts" | "loans";
export type View = { tab: Tab; id?: string; sub?: MoneySub };

const TABS: Tab[] = [ "overview", "plan", "goals", "money", "more" ];

export function viewUrl( v: View ) {
    const p = new URLSearchParams();
    if ( v.tab !== "overview" ) p.set( "tab", v.tab );
    if ( v.sub ) p.set( "sub", v.sub );
    if ( v.id ) p.set( "id", v.id );
    const q = p.toString();
    return q ? `/?${q}` : "/";
}

export function useView(): View {
    const sp = useSearchParams();
    const t = sp.get( "tab" ) as Tab | null;
    const tab = t && TABS.includes( t ) ? t : "overview";
    const sub = sp.get( "sub" ) === "loans" ? "loans" : sp.get( "sub" ) === "accounts" ? "accounts" : undefined;
    const id = sp.get( "id" ) ?? undefined;
    return { tab, id, sub };
}

export function navigate( v: View, opts: { replace?: boolean; keepScroll?: boolean } = {} ) {
    const url = viewUrl( v );
    if ( opts.replace ) window.history.replaceState( null, "", url );
    else window.history.pushState( null, "", url );
    if ( !opts.keepScroll ) window.scrollTo( { top: 0 } );
}

export function NavLink( { to, className, children, replace, onClick }: { to: View; className?: string; children: ReactNode; replace?: boolean; onClick?: () => void } ) {
    return (
        <a href={ viewUrl( to ) } className={ className } onClick={ ( e: MouseEvent ) => {
            if ( e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 ) return;
            e.preventDefault();
            onClick?.();
            navigate( to, { replace } );
        } }>
            { children }
        </a>
    );
}
