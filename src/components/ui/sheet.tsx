"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet on phones, centered dialog on larger screens.
 */
export function Sheet( {
    open, onOpenChange, title, description, children, className,
}: {
    open: boolean;
    onOpenChange: ( o: boolean ) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
} ) {
    return (
        <Dialog.Root open={ open } onOpenChange={ onOpenChange }>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_150ms_ease-out]" />
                <Dialog.Content
                    className={ cn(
                        "fixed z-50 flex flex-col bg-card outline-none",
                        "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl data-[state=open]:animate-[sheet-up_220ms_cubic-bezier(.2,.8,.2,1)]",
                        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:max-h-[85vh] sm:animate-none",
                        className,
                    ) }
                >
                    <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
                    <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-2 sm:pt-5">
                        <div>
                            <Dialog.Title className="text-lg font-semibold tracking-tight">{ title }</Dialog.Title>
                            { description ? (
                                <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">{ description }</Dialog.Description>
                            ) : <Dialog.Description className="sr-only">{ title }</Dialog.Description> }
                        </div>
                        <Dialog.Close className="-mr-2 -mt-1 rounded-full p-2 text-muted-foreground/75 hover:bg-muted hover:text-foreground/90" aria-label="Close">
                            <X size={ 18 } />
                        </Dialog.Close>
                    </div>
                    <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                        { children }
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
