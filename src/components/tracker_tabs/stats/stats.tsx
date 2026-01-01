"use client";

import { useEffect, useState } from "react";
import { getAllExpenses } from "@/db/index_db_helper";
import { CategoryMap, Expense } from "@/constants/types";
import {
    ChartPieDonutText,
    PieDatum,
} from "@/components/charts/pie-chart";
import {
    MonthKey,
    formatMonth,
    getRecentMonths,
} from "./month-utils";
import { MonthScroller } from "./month-scroller";

/* ---------- Helpers ---------- */

const groupByCategory = ( expenses: Expense[] ) => {
    return expenses.reduce<Record<string, number>>( ( acc, e ) => {
        acc[ e.categoryId ] = ( acc[ e.categoryId ] || 0 ) + e.amount;
        return acc;
    }, {} );
};

const getMonthRange = ( { year, month }: MonthKey ) => {
    const start = new Date( year, month, 1 ).getTime();
    const end = new Date(
        year,
        month + 1,
        0,
        23,
        59,
        59,
        999
    ).getTime();
    return { start, end };
};

const getDistinctDaysCount = ( expenses: Expense[] ) => {
    const days = new Set(
        expenses.map( ( e ) =>
            new Date( e.createdAt ).toDateString()
        )
    );
    return days.size;
};

const getDaysInMonth = ( { year, month }: MonthKey ) => {
    return new Date( year, month + 1, 0 ).getDate();
};

/* ---------- Component ---------- */

const now = new Date();

export const StatsTab = () => {
    const [ selectedMonth, setSelectedMonth ] = useState<MonthKey>( {
        year: now.getFullYear(),
        month: now.getMonth(),
    } );

    const [ loading, setLoading ] = useState( true );
    const [ monthlyExpenses, setMonthlyExpenses ] = useState<Expense[]>( [] );

    const months = getRecentMonths( 6 );

    useEffect( () => {
        setLoading( true );

        const { start, end } = getMonthRange( selectedMonth );

        fetch( `/api/expenses/month?year=${selectedMonth.year}&month=${selectedMonth.month}` )
            .then( res => res.json() )
            .then( setMonthlyExpenses ).finally( () => setLoading( false ) );
    }, [ selectedMonth ] );

    /* ---------- States ---------- */

    if ( loading ) {
        return (
            <div className="flex h-full items-center justify-center text-neutral-400">
                Loading stats…
            </div>
        );
    }

    if ( monthlyExpenses.length === 0 ) {
        return (
            <div className="p-4 space-y-6">
                <MonthScroller
                    months={ months }
                    selected={ selectedMonth }
                    onSelect={ setSelectedMonth }
                />
                <div className="flex h-[80vh] items-center justify-center text-neutral-400">
                    No expenses recorded for { formatMonth( selectedMonth ) }.
                </div>
            </div>
        );
    }

    /* ---------- Calculations ---------- */

    const total = monthlyExpenses.reduce(
        ( sum, e ) => sum + e.amount,
        0
    );

    const activeDays = getDistinctDaysCount( monthlyExpenses );

    const avgPerActiveDay =
        activeDays > 0 ? Math.round( total / activeDays ) : 0;

    const daysInSelectedMonth = getDaysInMonth( selectedMonth );

    const isCurrentMonth =
        selectedMonth.year === now.getFullYear() &&
        selectedMonth.month === now.getMonth();

    const expectedMonthlyExpense = isCurrentMonth
        ? avgPerActiveDay * daysInSelectedMonth
        : total;

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

    /* ---------- Render ---------- */

    return (
        <div className="p-4 space-y-6">
            {/* Month selector */ }
            <MonthScroller
                months={ months }
                selected={ selectedMonth }
                onSelect={ setSelectedMonth }
            />

            {/* Pie chart */ }
            <ChartPieDonutText data={ pieData } selectedMonth={ formatMonth( selectedMonth ) } />

            {/* Summary */ }
            <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2">
                <div className="text-sm text-neutral-500">
                    Total expense in { formatMonth( selectedMonth ) }
                </div>
                <div className="text-2xl font-semibold">
                    ₹{ total }
                </div>

                <div className="text-sm text-neutral-500">
                    Avg per active day: ₹{ avgPerActiveDay }
                </div>

                { isCurrentMonth && (
                    <div className="text-sm text-neutral-500">
                        Expected this month: ₹{ expectedMonthlyExpense }
                    </div>
                ) }
            </div>

            {/* Category breakdown */ }
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
