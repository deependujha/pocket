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
};

/* ---------- Default Categories ---------- */
/*
  Philosophy:
  - Broad, human categories
  - No overfitting
  - Easy to scan
*/

export const DEFAULT_CATEGORIES: Category[] = [
    {
        id: "food",
        name: "Food",
        icon: FcShop,
    },
    {
        id: "travel",
        name: "Travel",
        icon: FcShipped,
    },
    {
        id: "accessories",
        name: "Accessories",
        icon: FcInTransit,
    },
    {
        id: "harmful",
        name: "Smoking / Drinking",
        icon: FcHighPriority,
    },
    {
        id: "clothes",
        name: "Clothes",
        icon: FcPaid,
    },
    {
        id: "kitchen",
        name: "Kitchen",
        icon: FcHome,
    },
    {
        id: "washroom",
        name: "Washroom",
        icon: FcSupport,
    },
    {
        id: "personal",
        name: "Personal",
        icon: FcBusinessman,
    },
    {
        id: "sent",
        name: "Sent Money",
        icon: FcMoneyTransfer,
    },
    {
        id: "custom",
        name: "Custom",
        icon: FcPlus,
    },
    {
        id: "other",
        name: "Other",
        icon: FcPackage,
    },
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
