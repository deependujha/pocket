"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
    CategoryMap,
    DEFAULT_CATEGORIES,
    Expense,
} from "@/constants/types";
import { getAllExpenses } from "@/db/index_db_helper";

/* ---------- Utils ---------- */

const truncate = ( text: string, max = 5 ) =>
    text.length > max ? `${text.slice( 0, max )}…` : text;

const groupByDay = ( expenses: Expense[] ) => {
    return expenses.reduce<Record<string, Expense[]>>( ( acc, expense ) => {
        const dayKey = new Date( expense.createdAt ).toDateString();
        acc[ dayKey ] = acc[ dayKey ] || [];
        acc[ dayKey ].push( expense );
        return acc;
    }, {} );
};

/* ---------- Component ---------- */

export const HistoryTab = () => {
    const [ groupedExpenses, setGroupedExpenses ] = useState<
        Record<string, Expense[]>
    >( {} );
    const [ loading, setLoading ] = useState( true );

    useEffect( () => {
        getAllExpenses()
            .then( ( expenses ) => {
                const sorted = expenses.sort(
                    ( a, b ) => b.createdAt - a.createdAt
                );
                setGroupedExpenses( groupByDay( sorted ) );
            } )
            .finally( () => setLoading( false ) );
    }, [] );

    const onEdit = () => {
        toast.info( "History entries cannot be edited" );
    };

    const onDelete = () => {
        toast.info( "History entries cannot be deleted" );
    };

    if ( loading ) {
        return (
            <div className="flex h-full items-center justify-center text-neutral-400">
                Loading history…
            </div>
        );
    }

    const days = Object.keys( groupedExpenses );

    if ( days.length === 0 ) {
        return (
            <div className="flex h-full items-center justify-center text-neutral-400">
                No expense history yet.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            { days.map( ( day ) => (
                <div key={ day } className="space-y-3">
                    {/* Day header */ }
                    <div className="text-sm font-medium text-neutral-600">
                        { day }
                    </div>

                    {/* Day expenses */ }
                    <div className="rounded-lg border border-neutral-200 bg-white p-3">
                        <ul className="space-y-3">
                            { groupedExpenses[ day ].map( ( e ) => {
                                const category =
                                    CategoryMap[ e.categoryId ] ||
                                    DEFAULT_CATEGORIES[ 0 ];
                                const Icon = category.icon;

                                return (
                                    <li
                                        key={ e.id }
                                        className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg border border-neutral-200 p-3 items-center"
                                    >
                                        {/* Column 1 */ }
                                        <div className="flex flex-col items-center gap-1 min-w-12">
                                            <Icon size={ 18 } />
                                            <span
                                                title={ category.name }
                                                className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700"
                                            >
                                                { truncate( category.name ) }
                                            </span>
                                        </div>

                                        {/* Column 2 */ }
                                        <div className="flex flex-col leading-snug">
                                            <span className="font-medium">
                                                { e.title }
                                            </span>
                                            <span className="text-sm text-neutral-500">
                                                { e.description || "N/A" }
                                            </span>
                                            <button
                                                onClick={ onEdit }
                                                className="mt-1 text-xs text-neutral-400 hover:text-neutral-600 self-start cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </div>

                                        {/* Column 3 */ }
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-semibold">
                                                ₹{ e.amount }
                                            </span>
                                            <span className="text-xs text-neutral-400">
                                                { new Date(
                                                    e.createdAt
                                                ).toLocaleTimeString( [], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                } ) }
                                            </span>
                                            <button
                                                onClick={ onDelete }
                                                className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                );
                            } ) }
                        </ul>
                    </div>
                </div>
            ) ) }
        </div>
    );
};
