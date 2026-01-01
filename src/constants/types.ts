import {
    FcShop,
    FcShipped,
    FcHighPriority,
    FcPaid,
    FcInTransit,
    FcHome,
    FcSupport,
    FcBusinessman,
    FcMoneyTransfer,
    FcPlus,
    FcPackage,
} from "react-icons/fc";
import { IconType } from "react-icons";

/* ---------- Types ---------- */

export type Category = {
    id: string;
    name: string;
    icon: IconType;
    color: string;

};

/* ---------- Default Categories ---------- */
/*
  Philosophy:
  - Broad, human categories
  - No overfitting
  - Easy to scan
*/

export const DEFAULT_CATEGORIES: Category[] = [
    { id: "groceries", name: "Groceries", icon: FcShop, color: "#60a5fa" },
    { id: "travel", name: "Travel", icon: FcShipped, color: "#34d399" },
    { id: "accessories", name: "Accessories", icon: FcInTransit, color: "#a78bfa" },
    { id: "subscription", name: "Subscriptions", icon: FcPaid, color: "#f87171" },
    { id: "clothes", name: "Clothes", icon: FcPaid, color: "#fbbf24" },
    { id: "kitchen", name: "Kitchen", icon: FcHome, color: "#22d3ee" },
    { id: "washroom", name: "Washroom", icon: FcSupport, color: "#fb7185" },
    { id: "personal", name: "Personal", icon: FcBusinessman, color: "#c084fc" },
    { id: "sent", name: "Sent Money", icon: FcMoneyTransfer, color: "#94a3b8" },
    { id: "other", name: "Other", icon: FcPackage, color: "#a3a3a3" },
];



export const CategoryMap = DEFAULT_CATEGORIES.reduce( ( map, category ) => {
    map[ category.id ] = category;
    return map;
}, {} as Record<string, Category> );

export type Expense = {
    id: string;
    categoryId: string; // should match one of the default categories
    title: string;
    description?: string;
    amount: number;
    createdAt: number;
};

export type PieDatum = {
    name: string;
    value: number;
    fill: string;
};

