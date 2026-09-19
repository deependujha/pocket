"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ServiceWorker() {
    useEffect( () => {
        if ( "serviceWorker" in navigator && process.env.NODE_ENV === "production" ) {
            navigator.serviceWorker.register( "/sw.js" ).catch( () => {} );
        }
    }, [] );
    return null;
}

/** Toasts that follow the app theme instead of always being light. */
export function ThemedToaster() {
    const { resolvedTheme } = useTheme();
    return <Toaster position="top-center" theme={ resolvedTheme === "dark" ? "dark" : "light" } richColors closeButton={ false } toastOptions={ { className: "rounded-2xl" } } />;
}
