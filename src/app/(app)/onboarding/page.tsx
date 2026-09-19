import { requirePageUser } from "@/lib/auth";
import { loadSettings } from "@/lib/data";
import { OnboardingForm } from "@/components/settings/onboarding-form";

export const metadata = { title: "Set up" };

export default async function OnboardingPage() {
    const user = await requirePageUser();
    const settings = await loadSettings( user.id );
    return (
        <div className="mx-auto max-w-md px-4 pb-12">
            <div className="pt-4 pb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s set up your money</h1>
                <p className="mt-2 text-sm text-muted-foreground">Two numbers, a few targets, and Pocket drafts a monthly split you can edit. Everything is changeable later.</p>
            </div>

            <ol className="card mb-6 divide-y divide-border text-sm">
                { [
                    [ "🛟", "Job-loss cover", "Months of expenses in case salary stops. Untouchable." ],
                    [ "🏥", "Health emergency", "A separate pot for hospital bills. Insurance is an expense, not savings." ],
                    [ "🎉", "Fun fund", "Travel, gadgets, anything. Guilt-free once it's full." ],
                    [ "🌱", "Long-term", "Nifty 50 and a little gold, every month, from day one. Never stop." ],
                    [ "🔁", "Overflow", "When a pot fills up, its monthly amount moves to the next one. That's how phases happen." ],
                ].map( ( [ e, t, d ] ) => (
                    <li key={ t } className="flex gap-3 px-4 py-3">
                        <span className="text-lg leading-6">{ e }</span>
                        <div><div className="font-medium">{ t }</div><div className="text-muted-foreground">{ d }</div></div>
                    </li>
                ) ) }
            </ol>

            <OnboardingForm settings={ settings } />
        </div>
    );
}
