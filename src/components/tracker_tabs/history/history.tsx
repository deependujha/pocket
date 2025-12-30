"use client";

import { useEffect, useState } from "react";
import { deleteExpenseFromDB, getAllExpenses } from "@/db/index_db_helper";
import { CategoryMap, DEFAULT_CATEGORIES, Expense } from "@/components/constants/types";
import { toast } from "sonner";

/* ---------- Helpers ---------- */

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

    const deleteExpense = async ( id: string ) => {
        toast.warning( "Deleting feature is under development." );
        return;
        await deleteExpenseFromDB( id );
        toast.error( "Expense deleted" );

        setGroupedExpenses( ( prev ) => {
            const updated: Record<string, Expense[]> = {};

            Object.entries( prev ).forEach( ( [ day, expenses ] ) => {
                const filtered = expenses.filter( ( e ) => e.id !== id );
                if ( filtered.length > 0 ) {
                    updated[ day ] = filtered;
                }
            } );

            return updated;
        } );
    };

    const editExpense = ( id: string ) => {
        toast.warning( "Edit functionality is not implemented yet." );
    }

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
                    {/* Day Header */ }
                    <div className="text-sm font-medium text-neutral-600">
                        { day }
                    </div>

                    {/* Expenses for the day */ }
                    <ul className="space-y-3">
                        { groupedExpenses[ day ].map( ( e ) => {
                            const Icon = CategoryMap[ e.categoryId ]?.icon || DEFAULT_CATEGORIES[ 0 ].icon;

                            return (
                                <li
                                    key={ e.id }
                                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-start rounded-lg border border-neutral-200 p-3 bg-white"
                                >
                                    {/* Column 1 */ }
                                    <div className="flex flex-col items-center gap-1 min-w-12">
                                        <Icon size={ 18 } />
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                                            { CategoryMap[ e.categoryId ]?.name || "Uncategorized" }
                                        </span>
                                    </div>

                                    {/* Column 2 */ }
                                    <div className="flex flex-col justify-center leading-snug">
                                        <span className="font-medium">{ e.title }</span>
                                        <span className="text-sm text-neutral-500">
                                            { e.description || "N/A" }
                                        </span>
                                        {/* Actions */ }
                                        <button
                                            onClick={ () => editExpense( e.id ) }
                                            className="mt-1 text-xs text-neutral-400 hover:text-blue-500 self-start"
                                        >
                                            Edit
                                        </button>
                                    </div>

                                    {/* Column 3 */ }
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-semibold">₹{ e.amount }</span>
                                        <span className="text-xs text-neutral-400">
                                            { new Date( e.createdAt ).toLocaleTimeString( [], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            } ) }
                                        </span>
                                        <button
                                            onClick={ () => deleteExpense( e.id ) }
                                            className="text-xs text-neutral-400 hover:text-red-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            );
                        } ) }
                    </ul>
                </div>
            ) ) }
        </div>
    );
};
