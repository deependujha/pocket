export const saveExpense = async ( expense: {
    title: string;
    description?: string;
    amount: number;
    categoryId: string;
} ) => {
    const res = await fetch( "/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( expense ),
    } );

    if ( !res.ok ) {
        throw new Error( "Failed to save expense" );
    }

    return res.json();
};


export const updateExpense = async (
    id: string,
    payload: {
        title: string;
        description?: string;
        amount: number;
        categoryId: string;
    }
) => {
    const res = await fetch( `/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( payload ),
    } );

    if ( !res.ok ) {
        throw new Error( "Failed to update expense" );
    }

    return res.json();
};

export const deleteExpense = async ( id: string ) => {
    const res = await fetch( `/api/expenses/${id}`, {
        method: "DELETE",
    } );

    if ( !res.ok ) {
        throw new Error( "Failed to delete expense" );
    }
};
