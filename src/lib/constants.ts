import type { AccountType, GoalKind, Liquidity, MovementKind, LoanDirection } from "@/generated/prisma/enums";

/* ---------- Buckets: the 5 jobs money can have ---------- */

export type Bucket = "emergency" | "longterm" | "goals" | "free" | "lent";

export const BUCKETS: Record<Bucket, { label: string; hint: string; color: string }> = {
    emergency: { label: "Emergency", hint: "Job-loss cover and health fund. Untouchable.", color: "var(--viz-1)" },
    longterm: { label: "Long-term", hint: "Wealth you won't touch for 5+ years.", color: "var(--viz-2)" },
    goals: { label: "Goals", hint: "Saved for something specific.", color: "var(--viz-3)" },
    free: { label: "Free cash", hint: "Liquid, unallocated. Spend or assign.", color: "var(--viz-4)" },
    lent: { label: "Lent out", hint: "Money people owe you.", color: "var(--viz-5)" },
};

/* ---------- Account types ---------- */

export type AccountTypeMeta = {
    label: string;
    short: string;
    liquidity: Liquidity;
    group: "cash" | "deposit" | "invest" | "retire" | "debt";
    hasMaturity: boolean; // FD/RD style
    hasSip: boolean;      // monthly contribution
    hasInvested: boolean; // cost basis vs current value
    hint: string;
};

export const ACCOUNT_TYPES: Record<AccountType, AccountTypeMeta> = {
    SAVINGS: { label: "Savings account", short: "Savings", liquidity: "LIQUID", group: "cash", hasMaturity: false, hasSip: false, hasInvested: false, hint: "Your bank balance." },
    CASH: { label: "Cash in hand", short: "Cash", liquidity: "LIQUID", group: "cash", hasMaturity: false, hasSip: false, hasInvested: false, hint: "Wallet, drawer, envelope." },
    FD: { label: "Fixed deposit", short: "FD", liquidity: "SEMI", group: "deposit", hasMaturity: true, hasSip: false, hasInvested: true, hint: "One FD per goal keeps things clean." },
    RD: { label: "Recurring deposit", short: "RD", liquidity: "SEMI", group: "deposit", hasMaturity: true, hasSip: true, hasInvested: true, hint: "Fixed monthly deposit, fixed return." },
    PPF: { label: "PPF", short: "PPF", liquidity: "LOCKED", group: "retire", hasMaturity: true, hasSip: true, hasInvested: true, hint: "15-year lock-in, tax free." },
    EPF: { label: "EPF", short: "EPF", liquidity: "LOCKED", group: "retire", hasMaturity: false, hasSip: true, hasInvested: true, hint: "Provident fund via employer." },
    EQUITY_SIP: { label: "Index / equity SIP", short: "Equity SIP", liquidity: "SEMI", group: "invest", hasMaturity: false, hasSip: true, hasInvested: true, hint: "Nifty 50 ETF, index funds." },
    GOLD_SIP: { label: "Gold ETF / SGB", short: "Gold", liquidity: "SEMI", group: "invest", hasMaturity: false, hasSip: true, hasInvested: true, hint: "Gold as a hedge." },
    STOCKS: { label: "Stocks", short: "Stocks", liquidity: "SEMI", group: "invest", hasMaturity: false, hasSip: false, hasInvested: true, hint: "Direct equity." },
    MUTUAL_FUND: { label: "Mutual fund", short: "MF", liquidity: "SEMI", group: "invest", hasMaturity: false, hasSip: true, hasInvested: true, hint: "Any other fund." },
    CREDIT_CARD: { label: "Credit card", short: "Card", liquidity: "LIQUID", group: "debt", hasMaturity: false, hasSip: false, hasInvested: false, hint: "Enter the amount currently owed." },
    OTHER: { label: "Other", short: "Other", liquidity: "SEMI", group: "cash", hasMaturity: false, hasSip: false, hasInvested: false, hint: "" },
};

export const ACCOUNT_TYPE_ORDER: AccountType[] = [
    "SAVINGS", "CASH", "FD", "RD", "EQUITY_SIP", "GOLD_SIP", "STOCKS", "MUTUAL_FUND", "PPF", "EPF", "CREDIT_CARD", "OTHER",
];

export const ACCOUNT_GROUPS: Record<AccountTypeMeta[ "group" ], string> = {
    cash: "Cash & bank",
    deposit: "Deposits",
    invest: "Investments",
    retire: "Retirement",
    debt: "Cards & dues",
};

export const LIQUIDITY: Record<Liquidity, { label: string; hint: string }> = {
    LIQUID: { label: "Liquid", hint: "Spend today" },
    SEMI: { label: "Semi-liquid", hint: "Days, small penalty" },
    LOCKED: { label: "Locked", hint: "Years" },
};

export const MOVEMENT_KINDS: Record<MovementKind, { label: string; sign: 1 | -1 | 0 }> = {
    DEPOSIT: { label: "Deposit", sign: 1 },
    WITHDRAW: { label: "Withdraw", sign: -1 },
    INTEREST: { label: "Interest / dividend", sign: 1 },
    MARKET: { label: "Market change", sign: 0 },
    ADJUST: { label: "Correction", sign: 0 },
};

/* ---------- Goals ---------- */

export const GOAL_KINDS: Record<GoalKind, { label: string; emoji: string; hint: string }> = {
    EMERGENCY: { label: "Job-loss cover", emoji: "🛟", hint: "Months of expenses if salary stops. Untouchable." },
    HEALTH: { label: "Health emergency", emoji: "🏥", hint: "Hospital, surgery, family. Separate from job-loss cover." },
    WEALTH: { label: "Long-term wealth", emoji: "🌱", hint: "SIPs. No end date. Let it compound." },
    FUN: { label: "Fun fund", emoji: "🎉", hint: "Travel, gadgets, anything. Guilt-free." },
    PURCHASE: { label: "Purchase", emoji: "📱", hint: "Phone, laptop, bike, appliance." },
    GIFT: { label: "Gift", emoji: "🎁", hint: "For someone you love." },
    TRAVEL: { label: "Travel", emoji: "✈️", hint: "A trip, fully paid before you go." },
    EDUCATION: { label: "Education", emoji: "🎓", hint: "Course, degree, certification." },
    CUSTOM: { label: "Custom", emoji: "🎯", hint: "Anything else." },
};

export const GOAL_KIND_ORDER: GoalKind[] = [ "EMERGENCY", "HEALTH", "WEALTH", "FUN", "PURCHASE", "GIFT", "TRAVEL", "EDUCATION", "CUSTOM" ];

export const WHO_OPTIONS = [ "Me", "Mom", "Dad", "Sister", "Brother", "Partner", "Family", "Friend" ];

export const LOAN_DIRECTIONS: Record<LoanDirection, { label: string; hint: string }> = {
    LENT: { label: "I lent", hint: "They owe me" },
    BORROWED: { label: "I borrowed", hint: "I owe them" },
};

export const INVEST_TYPES: AccountType[] = [ "EQUITY_SIP", "GOLD_SIP", "STOCKS", "MUTUAL_FUND", "PPF", "EPF" ];
