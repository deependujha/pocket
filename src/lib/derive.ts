/** Pure helpers safe to import from client components. */
import type { Loan, LoanPayment } from "@/generated/prisma/client";

export type LoanLike = Loan & { payments: LoanPayment[] };

export const loanPaid = ( l: LoanLike ) => l.payments.reduce( ( s, p ) => s + p.amount, 0 );
export const loanLeft = ( l: LoanLike ) => Math.max( 0, l.amount - loanPaid( l ) );
