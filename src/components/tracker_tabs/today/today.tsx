"use client";

import { CategoryMap, DEFAULT_CATEGORIES, Expense } from "@/components/constants/types";
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { toast } from 'sonner'


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

    const [ categoryId, setCategoryId ] = useState( DEFAULT_CATEGORIES[ 0 ].id );
    const [ title, setTitle ] = useState( "" );
    const [ description, setDescription ] = useState( "" );
    const [ amount, setAmount ] = useState( "" );

    /* Load from IndexedDB */
    useEffect( () => {
        getAllExpenses()
            .then( ( data ) => {
                const normalized = data
                    .map( ( e ) => {
                        // Backward compatibility: older records stored the whole category object.
                        const legacyCategoryId = ( e as any ).category?.id;
                        const categoryId = ( e as any ).categoryId || legacyCategoryId || DEFAULT_CATEGORIES[ 0 ].id;
                        return { ...e, categoryId } as Expense;
                    } )
                    .sort( ( a, b ) => b.createdAt - a.createdAt );

                setExpenses( normalized );
            } )
            .finally( () => setLoading( false ) );
    }, [] );

    const addExpense = async () => {
        if ( !title || !amount ) return;

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
                expenses.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-neutral-500">
                        Add your first expense to see it here.
                    </div>
                ) : (
                    <div className="rounded-lg border border-neutral-200 bg-white p-3">
                        <ul className="space-y-3">
                            { expenses.map( ( e ) => {
                                const category = CategoryMap[ e.categoryId ] || DEFAULT_CATEGORIES[ 0 ];
                                const { icon: CategoryIcon, name: categoryName } = category;
                                return (
                                    <li
                                        key={ e.id }
                                        className="grid grid-cols-[auto_1fr_auto] gap-3 items-start rounded-lg border border-neutral-200 p-3"
                                    >
                                        {/* Column 1 */ }
                                        <div className="flex flex-col items-center gap-1 min-w-12">
                                            { CategoryIcon && <CategoryIcon size={ 20 } /> }
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                                                { categoryName }
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
                                )
                            } ) }
                        </ul>
                    </div>
                )
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
                            { DEFAULT_CATEGORIES.map( ( c ) => {
                                // const { icon: Icon } = c;
                                // In HTML, <svg> cannot be a child of <option>.
                                // react-icons return SVG elements, so we need to workaround this limitation.
                                // we can implement a custom dropdown later if needed.
                                return (
                                    <option key={ c.id } value={ c.id }>
                                        { c.name }
                                    </option>
                                )
                            } ) }
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
