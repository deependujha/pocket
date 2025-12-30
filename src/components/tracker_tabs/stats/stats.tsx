"use client";

import { useEffect, useState } from "react";
import { getAllExpenses } from "@/db/index_db_helper";
import {
    CategoryMap,
    Expense,
} from "@/components/constants/types";
import {
    ChartPieDonutText,
    PieDatum,
} from "@/components/charts/pie-chart";

/* ---------- Helpers ---------- */

const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date( now.getFullYear(), now.getMonth(), 1 ).getTime();
    const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    ).getTime();
    return { start, end };
};

const groupByCategory = ( expenses: Expense[] ) => {
    return expenses.reduce<Record<string, number>>( ( acc, e ) => {
        acc[ e.categoryId ] = ( acc[ e.categoryId ] || 0 ) + e.amount;
        return acc;
    }, {} );
};

/* ---------- Component ---------- */

export const StatsTab = () => {
    const [ loading, setLoading ] = useState( true );
    const [ monthlyExpenses, setMonthlyExpenses ] = useState<Expense[]>( [] );

    useEffect( () => {
        const { start, end } = getCurrentMonthRange();

        getAllExpenses()
            .then( ( expenses ) => {
                setMonthlyExpenses(
                    expenses.filter(
                        ( e ) => e.createdAt >= start && e.createdAt <= end
                    )
                );
            } )
            .finally( () => setLoading( false ) );
    }, [] );

    if ( loading ) {
        return (
            <div className="flex h-full items-center justify-center text-neutral-400">
                Loading stats…
            </div>
        );
    }

    if ( monthlyExpenses.length === 0 ) {
        return (
            <div className="flex h-full items-center justify-center text-neutral-400">
                No expenses this month.
            </div>
        );
    }

    const total = monthlyExpenses.reduce(
        ( sum, e ) => sum + e.amount,
        0
    );

    const daysSoFar = new Date().getDate();
    const avgPerDay = Math.round( total / daysSoFar );

    const groupedTotals = groupByCategory( monthlyExpenses );

    const pieData: PieDatum[] = Object.entries( groupedTotals ).map(
        ( [ categoryId, value ] ) => {
            const category = CategoryMap[ categoryId ];
            return {
                name: category?.name ?? "Unknown",
                value,
                fill: category?.color ?? "#e5e7eb",
            };
        }
    );

    return (
        <div className="p-4 space-y-6">
            {/* Pie Chart */ }
            <ChartPieDonutText data={ pieData } />

            {/* Summary */ }
            <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2">
                <div className="text-sm text-neutral-500">
                    Total this month
                </div>
                <div className="text-2xl font-semibold">
                    ₹{ total }
                </div>
                <div className="text-sm text-neutral-500">
                    Avg per day: ₹{ avgPerDay }
                </div>
            </div>

            {/* Category Breakdown */ }
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="text-sm font-medium text-neutral-600 mb-3">
                    By category
                </div>

                <ul className="space-y-2">
                    { pieData.map( ( item ) => (
                        <li
                            key={ item.name }
                            className="flex justify-between text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={ { backgroundColor: item.fill } }
                                />
                                <span className="text-neutral-600">
                                    { item.name }
                                </span>
                            </div>
                            <span className="font-medium">
                                ₹{ item.value }
                            </span>
                        </li>
                    ) ) }
                </ul>
            </div>
        </div>
    );
};
