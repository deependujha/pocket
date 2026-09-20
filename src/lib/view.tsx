"use client";

/**
 * Client-side routing for the single-page shell. The view lives in the URL
 * (?tab=funds&id=…) so reloads and back/forward work, but switching uses the
 * native History API, which Next syncs into useSearchParams with no server round trip.
 */
import { useSearchParams } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export type Tab = "wishes" | "funds" | "loans" | "more";
export type View = { tab: Tab; id?: string };

const TABS: Tab[] = [ "wishes", "funds", "loans", "more" ];

export function viewUrl( v: View ) {
    const p = new URLSearchParams();
    if ( v.tab !== "wishes" ) p.set( "tab", v.tab );
    if ( v.id ) p.set( "id", v.id );
    const q = p.toString();
    return q ? `/?${q}` : "/";
}

export function useView(): View {
    const sp = useSearchParams();
    const t = sp.get( "tab" ) as Tab | null;
    return { tab: t && TABS.includes( t ) ? t : "wishes", id: sp.get( "id" ) ?? undefined };
}

export function navigate( v: View, opts: { replace?: boolean; keepScroll?: boolean } = {} ) {
    const url = viewUrl( v );
    if ( opts.replace ) window.history.replaceState( null, "", url );
    else window.history.pushState( null, "", url );
    if ( !opts.keepScroll ) window.scrollTo( { top: 0 } );
}

export function NavLink( { to, className, children, onClick }: { to: View; className?: string; children: ReactNode; onClick?: () => void } ) {
    return (
        <a href={ viewUrl( to ) } className={ className } onClick={ ( e: MouseEvent ) => {
            if ( e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 ) return;
            e.preventDefault();
            onClick?.();
            navigate( to );
        } }>
            { children }
        </a>
    );
}
