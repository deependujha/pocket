import { z } from "zod";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export const optStr = z.string().trim().optional().transform( v => ( v ? v : null ) );
export const optInt = z.string().trim().optional().transform( v => ( v ? Math.round( Number( v ) ) : null ) ).pipe( z.number().int().nullable() );
export const optFloat = z.string().trim().optional().transform( v => ( v ? Number( v ) : null ) ).pipe( z.number().nullable() );
export const optDate = z.string().trim().optional().transform( v => ( v ? new Date( v ) : null ) );
export const reqInt = z.string().trim().min( 1, "Required" ).transform( v => Math.round( Number( v ) ) ).pipe( z.number().int() );
export const reqStr = z.string().trim().min( 1, "Required" );

export function parseForm<T extends z.ZodTypeAny>( schema: T, fd: FormData ): { data: z.infer<T> } | { error: string } {
    const raw: Record<string, unknown> = {};
    for ( const [ k, v ] of fd.entries() ) {
        if ( k.startsWith( "$" ) ) continue; // react internals
        if ( k.endsWith( "[]" ) ) {
            const key = k.slice( 0, -2 );
            ( raw[ key ] ??= [] as string[] );
            ( raw[ key ] as string[] ).push( String( v ) );
        } else raw[ k ] = v;
    }
    const r = schema.safeParse( raw );
    if ( !r.success ) {
        const issue = r.error.issues[ 0 ];
        return { error: `${issue.path.join( "." ) || "form"}: ${issue.message}` };
    }
    return { data: r.data };
}

export function fail( e: unknown ): ActionResult {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
}
