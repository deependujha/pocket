"use client";

import * as React from "react";
import { Pie, PieChart, Label } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

/* ---------- Types ---------- */

export type PieDatum = {
    name: string;
    value: number;
    fill: string;
};

/* ---------- Helpers ---------- */

const getCurrentMonthAndYear = () => {
    const now = new Date();
    const month = now.toLocaleString( "default", { month: "long" } );
    const year = now.getFullYear();
    return `${month} ${year}`;
};

/* ---------- Component ---------- */

export function ChartPieDonutText( {
    data,
}: {
    data: PieDatum[];
} ) {
    const chartConfig = React.useMemo( () =>
        data.reduce( ( acc, curr ) => {
            acc[ curr.name ] = {
                label: curr.name,
                color: curr.fill,
            };
            return acc;
        }, {} as Record<string, { label: string; color: string }> ),
        [ data ]
    );

    const total = React.useMemo(
        () => data.reduce( ( acc, curr ) => acc + curr.value, 0 ),
        [ data ]
    );

    return (
        <Card>
            <CardHeader className="items-center pb-0">
                <CardTitle>Expense Distribution</CardTitle>
                <CardDescription>{ getCurrentMonthAndYear() }</CardDescription>
            </CardHeader>

            <CardContent className="flex justify-center pb-0">
                <ChartContainer config={ chartConfig } className="aspect-square max-h-65 w-full">
                    <PieChart>
                        <ChartTooltip
                            cursor={ false }
                            content={ <ChartTooltipContent hideLabel /> }
                        />
                        <Pie
                            data={ data }
                            dataKey="value"
                            nameKey="name"
                            innerRadius={ 70 }
                            outerRadius={ 100 }
                            strokeWidth={ 4 }
                        >

                            <Label
                                content={ ( { viewBox } ) => {
                                    if ( !viewBox || !( "cx" in viewBox ) ) return null;

                                    return (
                                        <text
                                            x={ viewBox.cx }
                                            y={ viewBox.cy }
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            <tspan
                                                x={ viewBox.cx }
                                                y={ viewBox.cy }
                                                className="fill-foreground text-2xl font-bold"
                                            >
                                                ₹{ total.toLocaleString() }
                                            </tspan>
                                            <tspan
                                                x={ viewBox.cx }
                                                y={ ( viewBox.cy || 0 ) + 22 }
                                                className="fill-muted-foreground text-sm"
                                            >
                                                This month
                                            </tspan>
                                        </text>
                                    );
                                } }
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>

            <CardFooter className="text-sm text-muted-foreground justify-center">
                Showing category-wise monthly expenses
            </CardFooter>
        </Card>
    );
}
