"use client";

import React, { useState } from "react";
import { TrackerTabMap } from "@/components/tracker_tabs/tracker_map";

const tabs = Object.keys( TrackerTabMap );

export const TrackerPage = () => {
    const [ activeTab, setActiveTab ] = useState( tabs[ 0 ] );

    const ActiveComponent = TrackerTabMap[ activeTab ].component;

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Content */ }
            <main className="flex-1 overflow-auto">
                <ActiveComponent />
            </main>

            {/* Bottom Bar */ }
            <nav className="h-14 border-t border-neutral-200 flex justify-around items-center mb-2">
                { tabs.map( ( tab ) => {
                    const { icon: Icon, label } = TrackerTabMap[ tab ];
                    const isActive = activeTab === tab;

                    return (
                        <button
                            key={ tab }
                            onClick={ () => setActiveTab( tab ) }
                            className="flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer"
                        >
                            <Icon
                                size={ 20 }
                                className={ isActive ? "text-black" : "text-neutral-400" }
                            />
                            <span
                                className={
                                    isActive
                                        ? "text-black font-medium"
                                        : "text-neutral-400"
                                }
                            >
                                { label }
                            </span>
                        </button>
                    );
                } ) }
            </nav>
        </div>
    );
};
