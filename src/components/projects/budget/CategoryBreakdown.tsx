"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface BudgetLine {
    id: string;
    amount: number;
    category?: string;
}

interface CategoryBreakdownProps {
    budgetLines: BudgetLine[];
}

const COLORS = [
    "hsl(var(--brand-teal))",
    "hsl(var(--brand-sage))",
    "hsl(var(--brand-sky))",
    "hsl(var(--brand-mint))",
    "hsl(var(--brand-charcoal))",
];

export function CategoryBreakdown({ budgetLines }: CategoryBreakdownProps) {
    const data = useMemo(() => {
        const categoryMap = new Map<string, number>();

        budgetLines.forEach(line => {
            if (line.category === "Staffing") return; // Exclude Staffing
            const cat = line.category || "Uncategorized";
            const current = categoryMap.get(cat) || 0;
            const amount = Number(line.amount) || 0;
            categoryMap.set(cat, current + amount);
        });

        const sorted = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        if (sorted.length > 4) {
            const top4 = sorted.slice(0, 4);
            const other = sorted.slice(4).reduce((sum, item) => sum + item.value, 0);
            return [...top4, { name: "Other", value: other }];
        }

        return sorted;
    }, [budgetLines]);

    const totalOperational = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-[10px] font-bold text-brand-mint uppercase tracking-widest mb-1 opacity-80">
                Operational Budget Mix
            </h3>
            <div className="text-3xl font-black text-white font-rajdhani tracking-tighter mb-4">
                ${totalOperational.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>

            <div className="flex-1 min-h-[150px] -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                            contentStyle={{
                                backgroundColor: "hsl(var(--brand-charcoal))",
                                borderColor: "hsl(var(--brand-teal))",
                                color: "white",
                                fontSize: "12px",
                                borderRadius: "8px"
                            }}
                            itemStyle={{ color: "white" }}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            iconSize={8}
                            wrapperStyle={{ fontSize: "10px", color: "white", opacity: 0.8 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
