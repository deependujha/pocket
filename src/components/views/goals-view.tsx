"use client";

import { Target } from "lucide-react";
import { useData } from "@/components/shell/data-provider";
import { planFor } from "@/lib/plan-lines";
import { goalProgress } from "@/lib/finance";
import { inr } from "@/lib/money";
import { PageHeader, Section, Empty } from "@/components/ui/page";
import { AddGoalButton } from "@/components/goals/goal-sheets";
import { GoalCard } from "@/components/goals/goal-card";

export function GoalsView() {
    const { data: all } = useData();
    const accounts = all.accounts.filter( a => !a.archived );
    const goals = all.goals;
    const plan = planFor( goals, accounts, all.loans, all.phases, all.settings );
    const goalOpts = goals.filter( g => g.status === "ACTIVE" ).map( g => ( { id: g.id, name: g.name, emoji: g.emoji } ) );
    const linkable = accounts.map( a => ( { id: a.id, name: a.name, type: a.type, balance: a.balance, goalId: a.goalId, goalName: a.goal?.name } ) );
    const progress = goals.map( g => goalProgress( g, accounts ) );
    const active = progress.filter( p => p.goal.status === "ACTIVE" );
    const rest = progress.filter( p => p.goal.status !== "ACTIVE" && p.goal.status !== "ARCHIVED" );
    const archived = progress.filter( p => p.goal.status === "ARCHIVED" );
    const saved = active.reduce( ( s, p ) => s + p.current, 0 );
    const monthly = active.reduce( ( s, p ) => s + p.monthly, 0 );
    const card = ( p: ( typeof progress )[ number ] ) => <GoalCard key={ p.goal.id } p={ p } doneMonth={ plan.doneMonth[ p.goal.id ] ?? null } />;

    return (
        <div>
            <PageHeader title="Goals" subtitle={ active.length ? <>{ inr( saved ) } saved across { active.length } active · { inr( monthly ) }/month planned</> : "What the money is for." }
                action={ <AddGoalButton accounts={ linkable } goals={ goalOpts } /> } />
            { progress.length === 0 && (
                <Empty icon={ <Target size={ 36 } /> } title="No goals yet" body="Start with job-loss cover. Then something you want, with a date." action={ <AddGoalButton accounts={ linkable } goals={ goalOpts } /> } />
            ) }
            { active.length > 0 && <Section><div className="grid gap-3">{ active.map( card ) }</div></Section> }
            { rest.length > 0 && <Section title="Achieved & paused"><div className="grid gap-3">{ rest.map( card ) }</div></Section> }
            { archived.length > 0 && <Section title="Archived"><div className="grid gap-3 opacity-60">{ archived.map( card ) }</div></Section> }
        </div>
    );
}
