import { Expense } from "@/components/constants/types";
import { toast } from 'sonner'

export const DB_NAME = "expense-tracker";
export const STORE_NAME = "expenses";
export const DB_VERSION = 1;


const startOfToday = () => {
    const d = new Date();
    d.setHours( 0, 0, 0, 0 );
    return d.getTime();
};

const endOfToday = () => {
    const d = new Date();
    d.setHours( 23, 59, 59, 999 );
    return d.getTime();
};



export const openDB = (): Promise<IDBDatabase> =>
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

export const getAllExpenses = async (): Promise<Expense[]> => {
    const db = await openDB();
    return new Promise( ( resolve ) => {
        const tx = db.transaction( STORE_NAME, "readonly" );
        const store = tx.objectStore( STORE_NAME );
        const req = store.getAll();
        req.onsuccess = () => resolve( req.result as Expense[] );
    } );
};

export const getTodayExpenses = async (): Promise<Expense[]> => {
    const db = await openDB();

    return new Promise( ( resolve ) => {
        const tx = db.transaction( STORE_NAME, "readonly" );
        const store = tx.objectStore( STORE_NAME );
        const req = store.getAll();

        req.onsuccess = () => {
            const all = req.result as Expense[];
            const start = startOfToday();
            const end = endOfToday();

            resolve(
                all.filter(
                    ( e ) => e.createdAt >= start && e.createdAt <= end
                )
            );
        };
    } );
};


export const saveExpense = async ( expense: Expense ) => {
    const db = await openDB();
    db.transaction( STORE_NAME, "readwrite" )
        .objectStore( STORE_NAME )
        .put( expense );
    toast.success( 'Expense added successfully!' );
};

export const deleteExpenseFromDB = async ( id: string ) => {
    const db = await openDB();
    db.transaction( STORE_NAME, "readwrite" )
        .objectStore( STORE_NAME )
        .delete( id );
    toast.error( 'Expense deleted successfully!' );
};


export const clearAllData = (): Promise<void> =>
    new Promise( ( resolve, reject ) => {
        const request = indexedDB.open( DB_NAME );

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction( STORE_NAME, "readwrite" );
            tx.objectStore( STORE_NAME ).clear();

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject( tx.error );
        };

        request.onerror = () => reject( request.error );
    } );