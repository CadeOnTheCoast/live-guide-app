"use client";

import { Card } from "@/components/ui/card";

interface BudgetLine {
    id: string;
    amount: number;
    period: string;
}

interface BudgetSummaryProps {
    budgetLines: BudgetLine[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function BudgetSummary({ budgetLines }: BudgetSummaryProps) {
    const monthlyTotals = MONTHS.map((month) => {
        return budgetLines
            .filter((line) => line.period.startsWith(month))
            .reduce((sum, line) => {
                const amt = Number(line.amount) || 0;
                return sum + amt;
            }, 0);
    });

    const maxTotal = Math.max(...monthlyTotals, 1);
    const totalBudget = monthlyTotals.reduce((a, b) => a + b, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-2 p-6 border-brand-sky/20 bg-white/50 backdrop-blur-sm shadow-sm rounded-2xl">
                <h3 className="text-[10px] font-bold text-brand-charcoal uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="h-2 w-2 bg-brand-teal rounded-full" />
                    Expense Timing (2025)
                </h3>
                <div className="flex items-end justify-between h-48 gap-3">
                    {monthlyTotals.map((total, i) => (
                        <div key={MONTHS[i]} className="flex-1 flex flex-col items-center group">
                            <div
                                className="w-full bg-brand-teal/20 rounded-t-lg transition-all group-hover:bg-brand-teal/40 relative cursor-default"
                                style={{ height: `${(total / maxTotal) * 100}%` }}
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-brand-charcoal text-white text-[10px] py-1.5 px-2.5 rounded shadow-xl whitespace-nowrap z-10 transform translate-y-2 group-hover:translate-y-0">
                                    ${total.toLocaleString()}
                                </div>
                            </div>
                            <span className="text-[10px] text-brand-sage font-bold mt-4 tracking-tighter">{MONTHS[i]}</span>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="p-6 border-brand-sky/20 bg-brand-charcoal overflow-hidden relative shadow-lg rounded-2xl flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                    <div className="h-40 w-40 rounded-full border-[12px] border-white" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-[10px] font-bold text-brand-mint uppercase tracking-widest mb-1 opacity-80">Annual Budget Allocation</h3>
                    <div className="text-5xl font-black text-white font-rajdhani tracking-tighter">
                        ${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="flex justify-between items-center text-[9px] text-white/40 font-bold uppercase tracking-widest">
                            <span>RECURRING EXPENSES</span>
                            <span className="text-white">42%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-sky w-[42%]" />
                        </div>

                        <div className="flex justify-between items-center text-[9px] text-white/40 font-bold uppercase tracking-widest">
                            <span>PROJECT SPECIFIC</span>
                            <span className="text-white">58%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-mint w-[58%]" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
                    <div className="flex justify-between items-center text-[10px] text-brand-mint font-bold uppercase tracking-widest">
                        <span>Tracking Accuracy</span>
                        <span>92%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-mint w-[92%]" />
                    </div>
                </div>
            </Card>
        </div>
    );
}
