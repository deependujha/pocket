import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignInButton } from "@/components/shell/sign-in-button";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
    const user = await getCurrentUser();
    if ( user ) redirect( "/" );

    return (
        <main className="flex min-h-dvh flex-col px-6">
            <div className="flex-1" />
            <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-card shadow-sm ring-1 ring-border">
                    { /* eslint-disable-next-line @next/next/no-img-element */ }
                    <img src="/logo.svg" alt="" className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Pocket</h1>
                <p className="mt-2 text-balance text-sm text-muted-foreground">
                    Emergency fund, goals, SIPs and loans: one calm view of where you stand.
                </p>
                <SignInButton />
                <p className="mt-6 max-w-xs text-xs text-muted-foreground/75">
                    Nothing is linked to your bank. You enter the numbers; they live in your own database.
                </p>
            </div>
            <div className="flex-1" />
        </main>
    );
}
