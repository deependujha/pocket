"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { toast } from "sonner";

import {
    CategoryMap,
    DEFAULT_CATEGORIES,
    Expense,
} from "@/components/constants/types";
import {
    deleteExpenseFromDB,
    getTodayExpenses,
    saveExpense,
} from "@/db/index_db_helper";

/* ---------- Utils ---------- */

const truncate = ( text: string, max = 5 ) =>
    text.length > max ? `${text.slice( 0, max )}…` : text;

/* ---------- Component ---------- */

export const TodayTab = () => {
    const [ expenses, setExpenses ] = useState<Expense[]>( [] );
    const [ loading, setLoading ] = useState( true );
    const [ showForm, setShowForm ] = useState( false );
    const [ editingId, setEditingId ] = useState<string | null>( null );

    const [ categoryId, setCategoryId ] = useState(
        DEFAULT_CATEGORIES[ 0 ].id
    );
    const [ title, setTitle ] = useState( "" );
    const [ description, setDescription ] = useState( "" );
    const [ amount, setAmount ] = useState( "" );

    /* ---------- Load today's expenses ---------- */

    useEffect( () => {
        getTodayExpenses()
            .then( ( data ) => {
                const normalized = data
                    .map( ( e ) => {
                        const legacyCategoryId = ( e as any ).category?.id;
                        const categoryId =
                            ( e as any ).categoryId ||
                            legacyCategoryId ||
                            DEFAULT_CATEGORIES[ 0 ].id;

                        return { ...e, categoryId } as Expense;
                    } )
                    .sort( ( a, b ) => b.createdAt - a.createdAt );

                setExpenses( normalized );
            } )
            .finally( () => setLoading( false ) );
    }, [] );

    /* ---------- Add / Update ---------- */

    const saveOrUpdateExpense = async () => {
        if ( !title || !amount ) return;

        if ( editingId ) {
            const existing = expenses.find( ( e ) => e.id === editingId );
            if ( !existing ) return;

            const updated: Expense = {
                ...existing,
                categoryId,
                title,
                description: description || undefined,
                amount: Number( amount ),
            };

            setExpenses( ( prev ) =>
                prev.map( ( e ) => ( e.id === editingId ? updated : e ) )
            );

            await saveExpense( updated );
            toast.success( "Expense updated" );
        } else {
            const expense: Expense = {
                id: crypto.randomUUID(),
                categoryId,
                title,
                description: description || undefined,
                amount: Number( amount ),
                createdAt: Date.now(),
            };

            setExpenses( ( prev ) => [ expense, ...prev ] );
            await saveExpense( expense );
            toast.success( "Expense added" );
        }

        resetForm();
    };

    /* ---------- Edit ---------- */

    const editExpense = ( id: string ) => {
        const expense = expenses.find( ( e ) => e.id === id );
        if ( !expense ) return;

        setEditingId( id );
        setCategoryId( expense.categoryId );
        setTitle( expense.title );
        setDescription( expense.description || "" );
        setAmount( String( expense.amount ) );
        setShowForm( true );
    };

    /* ---------- Delete ---------- */

    const deleteExpense = async ( id: string ) => {
        setExpenses( ( prev ) => prev.filter( ( e ) => e.id !== id ) );
        await deleteExpenseFromDB( id );
        toast.error( "Expense deleted" );
    };

    /* ---------- Reset ---------- */

    const resetForm = () => {
        setEditingId( null );
        setCategoryId( DEFAULT_CATEGORIES[ 0 ].id );
        setTitle( "" );
        setDescription( "" );
        setAmount( "" );
        setShowForm( false );
    };

    /* ---------- Render ---------- */

    return (
        <div className="relative h-full p-4">
            {/* Loading */ }
            { loading && (
                <div className="flex h-full items-center justify-center text-neutral-400">
                    Loading expenses…
                </div>
            ) }

            {/* Empty */ }
            { !loading && expenses.length === 0 && (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-neutral-500">
                    Add your first expense to see it here.
                </div>
            ) }

            {/* List */ }
            { !loading && expenses.length > 0 && (
                <div className="rounded-lg border border-neutral-200 bg-white p-3">
                    <ul className="space-y-3">
                        { expenses.map( ( e ) => {
                            const category =
                                CategoryMap[ e.categoryId ] ||
                                DEFAULT_CATEGORIES[ 0 ];
                            const Icon = category.icon;

                            return (
                                <li
                                    key={ e.id }
                                    className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg border border-neutral-200 p-3"
                                >
                                    {/* Column 1 */ }
                                    <div className="flex flex-col items-center gap-1 min-w-12">
                                        <Icon size={ 20 } />
                                        <span
                                            title={ category.name }
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700"
                                        >
                                            { truncate( category.name ) }
                                        </span>
                                    </div>

                                    {/* Column 2 */ }
                                    <div className="flex flex-col leading-snug">
                                        <span className="font-medium">{ e.title }</span>
                                        <span className="text-sm text-neutral-500">
                                            { e.description || "N/A" }
                                        </span>
                                        <button
                                            onClick={ () => editExpense( e.id ) }
                                            className="mt-1 text-xs text-neutral-400 hover:text-blue-500 self-start"
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
                                            { new Date( e.createdAt ).toLocaleTimeString(
                                                [],
                                                { hour: "2-digit", minute: "2-digit" }
                                            ) }
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
            ) }

            {/* Bottom Sheet */ }
            { showForm && (
                <div className="fixed inset-0 bg-black/30 flex items-end z-50">
                    <div className="w-full rounded-t-xl bg-background p-4 space-y-3">
                        <select
                            value={ categoryId }
                            onChange={ ( e ) => setCategoryId( e.target.value ) }
                            className="w-full border p-2 rounded"
                        >
                            { DEFAULT_CATEGORIES.map( ( c ) => (
                                <option key={ c.id } value={ c.id }>
                                    { c.name }
                                </option>
                            ) ) }
                        </select>

                        <input
                            placeholder="Item"
                            value={ title }
                            onChange={ ( e ) => setTitle( e.target.value ) }
                            className="w-full border p-2 rounded"
                        />

                        <input
                            placeholder="Description (optional)"
                            value={ description }
                            onChange={ ( e ) => setDescription( e.target.value ) }
                            className="w-full border p-2 rounded"
                        />

                        <input
                            placeholder="Amount"
                            type="number"
                            value={ amount }
                            onChange={ ( e ) => setAmount( e.target.value ) }
                            className="w-full border p-2 rounded"
                        />

                        <button
                            onClick={ saveOrUpdateExpense }
                            className="w-full bg-black text-white py-2 rounded-xl font-medium"
                        >
                            { editingId ? "Update Expense" : "Add Expense" }
                        </button>
                    </div>
                </div>
            ) }

            {/* FAB */ }
            { !loading && (
                <button
                    onClick={ () => setShowForm( true ) }
                    className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg"
                >
                    <FiPlus size={ 22 } />
                </button>
            ) }
        </div>
    );
};
