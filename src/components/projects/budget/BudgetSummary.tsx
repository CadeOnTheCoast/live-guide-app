"use client";

import { ExternalLink } from "lucide-react";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { Card } from "@/components/ui/card";

// ... (existing interfaces)

export function BudgetSummary({ budgetLines }: BudgetSummaryProps) {
    // ... (existing logic)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-2 p-6 border-brand-sky/20 bg-white/50 backdrop-blur-sm shadow-sm rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-bold text-brand-charcoal uppercase tracking-widest flex items-center gap-2">
                        <div className="h-2 w-2 bg-brand-teal rounded-full" />
                        Expense Timing (2025)
                    </h3>
                    <a
                        href="https://mobilebaykeeper.sharepoint.com/:x:/s/TeamMobileBaykeeper/IQDa--Y03kMjRaNQUmOKNDHaAezYOJf-8ufYolkN5wPjC7o?e=nWrDjU&nav=MTNfezdEMkM3NUIwLUJBODQtNDU1My1BQTYwLUM2NDBBNDE2N0ZEOH1fezk4N0YwNDBGLTE5MTgtNDkyMi1CM0Q4LUZFMTgyNDY4QUZBMX0"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View Cash Flow in Excel"
                        className="text-brand-sage hover:text-brand-teal transition-colors"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
                <div className="flex items-end justify-between h-48 gap-3">
                    {monthlyTotals.map((total, i) => (
                        <div key={MONTHS[i]} className="flex-1 flex flex-col items-center group h-full justify-end">
                            <div
                                className="w-full bg-brand-teal rounded-t-lg transition-all group-hover:bg-brand-charcoal relative cursor-default"
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
                <div className="relative z-10 h-full flex flex-col">
                    <CategoryBreakdown budgetLines={budgetLines} />

                    <div className="mt-auto pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center text-[10px] text-brand-mint font-bold uppercase tracking-widest">
                            <span>Tracking Accuracy</span>
                            <span>100%</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-mint w-full" />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
