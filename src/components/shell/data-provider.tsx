"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Everything } from "@/lib/data";
import type { SessionUser } from "@/lib/auth";
import { fetchEverything } from "@/actions/data";

type Ctx = {
    data: Everything;
    user: SessionUser;
    refreshing: boolean;
    /** Re-pull everything from the server. Call after any write. */
    refresh: () => Promise<void>;
    /** Apply a change locally right away; the next refresh replaces it with the truth. */
    patch: ( fn: ( d: Everything ) => Everything ) => void;
};

const DataCtx = createContext<Ctx | null>( null );

export function DataProvider( { initial, user, children }: { initial: Everything; user: SessionUser; children: React.ReactNode } ) {
    const [ data, setData ] = useState( initial );
    const [ refreshing, setRefreshing ] = useState( false );
    const last = useRef( 0 ); // set on mount; Date.now() is not allowed during render
    const inflight = useRef<Promise<void> | null>( null );

    const refresh = useCallback( () => {
        if ( inflight.current ) return inflight.current;
        setRefreshing( true );
        inflight.current = fetchEverything()
            .then( d => { setData( d ); last.current = Date.now(); } )
            .catch( () => {} )
            .finally( () => { setRefreshing( false ); inflight.current = null; } );
        return inflight.current;
    }, [] );

    // Coming back to the app (PWA resume, tab switch) after a while: refresh quietly in the background.
    useEffect( () => {
        last.current = Date.now();
        const onVisible = () => { if ( document.visibilityState === "visible" && Date.now() - last.current > 60_000 ) refresh(); };
        document.addEventListener( "visibilitychange", onVisible );
        window.addEventListener( "focus", onVisible );
        return () => { document.removeEventListener( "visibilitychange", onVisible ); window.removeEventListener( "focus", onVisible ); };
    }, [ refresh ] );

    // Called from inside form actions, which run in a React transition that holds updates
    // until the action resolves. A macrotask steps out of that so the change paints now.
    const patch = useCallback( ( fn: ( d: Everything ) => Everything ) => { setTimeout( () => setData( d => fn( d ) ), 0 ); }, [] );

    return <DataCtx.Provider value={ { data, user, refreshing, refresh, patch } }>{ children }</DataCtx.Provider>;
}

export function useData() {
    const c = useContext( DataCtx );
    if ( !c ) throw new Error( "useData outside DataProvider" );
    return c;
}

export function useRefresh() { return useData().refresh; }
export function usePatch() { return useData().patch; }
