"use client";

import { MonthKey, formatMonth } from "./month-utils";

type Props = {
    months: MonthKey[];
    selected: MonthKey;
    onSelect: ( m: MonthKey ) => void;
};

export const MonthScroller = ( {
    months,
    selected,
    onSelect,
}: Props ) => {
    return (
        <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2 px-1 py-2 min-w-max">
                { months.map( ( m ) => {
                    const isActive =
                        m.year === selected.year && m.month === selected.month;

                    return (
                        <button
                            key={ `${m.year}-${m.month}` }
                            onClick={ () => onSelect( m ) }
                            className={ `px-3 py-1.5 rounded-full text-sm whitespace-nowrap border cursor-pointer
                ${isActive
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-neutral-600 border-neutral-300"
                                }
              `}
                        >
                            { formatMonth( m ) }
                        </button>
                    );
                } ) }
            </div>
        </div>
    );
};
