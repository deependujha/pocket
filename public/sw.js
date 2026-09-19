/* Pocket service worker: makes the app installable and keeps the shell snappy.
 * Pages are always fetched from the network (your numbers must be fresh);
 * built assets and icons are cached after first use. */
const VERSION = "pocket-v3";
self.addEventListener( "install", () => self.skipWaiting() );
self.addEventListener( "activate", e => e.waitUntil( ( async () => {
    for ( const k of await caches.keys() ) if ( k !== VERSION ) await caches.delete( k );
    await self.clients.claim();
} )() ) );
self.addEventListener( "fetch", e => {
    const url = new URL( e.request.url );
    if ( e.request.method !== "GET" || url.origin !== location.origin ) return;
    const isAsset = url.pathname.startsWith( "/_next/static/" ) || url.pathname.startsWith( "/favicon/" ) || /\.(svg|png|ico|woff2?)$/.test( url.pathname );
    if ( !isAsset ) return;
    e.respondWith( ( async () => {
        const cache = await caches.open( VERSION );
        const hit = await cache.match( e.request );
        if ( hit ) return hit;
        const res = await fetch( e.request );
        if ( res.ok ) cache.put( e.request, res.clone() );
        return res;
    } )() );
} );
