"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Toaster, toast } from 'sonner'


/* ---------- Types ---------- */

type Category = {
    id: string;
    name: string;
    emoji: string;
};

type Expense = {
    id: string;
    category: Category;
    title: string;
    description?: string;
    amount: number;
    createdAt: number;
};

/* ---------- Static Data ---------- */

const categories: Category[] = [
    { id: "food", name: "Food", emoji: "🍔" },
    { id: "coffee", name: "Coffee", emoji: "☕" },
    { id: "travel", name: "Travel", emoji: "🚕" },
    { id: "shopping", name: "Shopping", emoji: "🛍️" },
];

/* ---------- IndexedDB Helpers ---------- */

const DB_NAME = "expense-tracker";
const STORE_NAME = "expenses";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> =>
    new Promise( ( resolve, reject ) => {
        const request = indexedDB.open( DB_NAME, DB_VERSION );

        request.onupgradeneeded = () => {
            const db = request.result;
            if ( !db.objectStoreNames.contains( STORE_NAME ) ) {
                db.createObjectStore( STORE_NAME, { keyPath: "id" } );
            }
        };

        request.onsuccess = () => resolve( request.result );
        request.onerror = () => reject( request.error );
    } );

const getAllExpenses = async (): Promise<Expense[]> => {
    const db = await openDB();
    return new Promise( ( resolve ) => {
        const tx = db.transaction( STORE_NAME, "readonly" );
        const store = tx.objectStore( STORE_NAME );
        const req = store.getAll();
        req.onsuccess = () => resolve( req.result as Expense[] );
    } );
};

const saveExpense = async ( expense: Expense ) => {
    const db = await openDB();
    db.transaction( STORE_NAME, "readwrite" )
        .objectStore( STORE_NAME )
        .put( expense );
    toast.success( 'Expense added successfully!' );
};

const deleteExpenseFromDB = async ( id: string ) => {
    const db = await openDB();
    db.transaction( STORE_NAME, "readwrite" )
        .objectStore( STORE_NAME )
        .delete( id );
    toast.error( 'Expense deleted successfully!' );
};

/* ---------- Component ---------- */

export const TodayTab = () => {
    const [ expenses, setExpenses ] = useState<Expense[]>( [] );
    const [ loading, setLoading ] = useState( true );
    const [ showForm, setShowForm ] = useState( false );

    const [ categoryId, setCategoryId ] = useState( categories[ 0 ].id );
    const [ title, setTitle ] = useState( "" );
    const [ description, setDescription ] = useState( "" );
    const [ amount, setAmount ] = useState( "" );

    /* Load from IndexedDB */
    useEffect( () => {
        getAllExpenses()
            .then( ( data ) =>
                setExpenses( data.sort( ( a, b ) => b.createdAt - a.createdAt ) )
            )
            .finally( () => setLoading( false ) );
    }, [] );

    const addExpense = async () => {
        if ( !title || !amount ) return;

        const category = categories.find( ( c ) => c.id === categoryId )!;

        const expense: Expense = {
            id: crypto.randomUUID(),
            category,
            title,
            description: description || undefined,
            amount: Number( amount ),
            createdAt: Date.now(),
        };

        setExpenses( ( prev ) => [ expense, ...prev ] );
        await saveExpense( expense );

        setTitle( "" );
        setDescription( "" );
        setAmount( "" );
        setShowForm( false );
    };

    const deleteExpense = async ( id: string ) => {
        setExpenses( ( prev ) => prev.filter( ( e ) => e.id !== id ) );
        await deleteExpenseFromDB( id );
    };

    const editExpense = ( id: string ) => {
        toast.warning( "Edit functionality is not implemented yet." );
    }

    return (
        <div className="relative h-full p-4">
            {/* Loading state */ }
            { loading && (
                <div className="flex h-full items-center justify-center text-neutral-400">
                    Loading expenses…
                </div>
            ) }

            { !loading && (
                <ul className="space-y-3">
                    { expenses.map( ( e ) => (
                        <li
                            key={ e.id }
                            className="grid grid-cols-[auto_1fr_auto] gap-3 items-start rounded-lg border border-neutral-200 p-3"
                        >
                            {/* Column 1 */ }
                            <div className="flex flex-col items-center gap-1 min-w-12">
                                <span className="text-lg">{ e.category.emoji }</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                                    { e.category.name }
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
                    ) ) }
                </ul>
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
                            { categories.map( ( c ) => (
                                <option key={ c.id } value={ c.id }>
                                    { c.emoji } { c.name }
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
                            onClick={ addExpense }
                            className="w-full bg-black text-white py-2 rounded font-medium"
                        >
                            Add Expense
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
