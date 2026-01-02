"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface StaffAllocation {
    id: string;
    person: { name: string; email: string };
    hours: number;
    period: string;
}

interface StaffAllocationTableProps {
    allocations: StaffAllocation[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function StaffAllocationTable({ allocations }: StaffAllocationTableProps) {
    const groupedRows: Record<string, any> = {};

    allocations.forEach((alloc) => {
        const key = alloc.person.email;
        if (!groupedRows[key]) {
            groupedRows[key] = {
                name: alloc.person.name,
                months: {},
            };
        }
        const month = alloc.period.split(" ")[0];
        groupedRows[key].months[month] = alloc.hours;
    });

    return (
        <div className="rounded-2xl border border-brand-sky/20 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-brand-sky/10">
                        <TableRow className="border-b border-brand-sky/20">
                            <TableHead className="w-[200px] font-bold text-brand-charcoal text-[10px] uppercase tracking-widest">Team Member</TableHead>
                            {MONTHS.map((m) => (
                                <TableHead key={m} className="w-[100px] text-center font-bold text-brand-charcoal text-[10px] uppercase tracking-widest">{m} (hrs)</TableHead>
                            ))}
                            <TableHead className="w-[120px] text-right font-bold text-brand-charcoal text-[10px] uppercase tracking-widest">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedRows).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={MONTHS.length + 2} className="h-24 text-center text-brand-sage italic text-xs">
                                    No staff allocations recorded for this project and timeframe.
                                </TableCell>
                            </TableRow>
                        ) : (
                            Object.values(groupedRows).map((row, idx) => {
                                let rowTotal = 0;
                                MONTHS.forEach((m) => {
                                    if (row.months[m]) rowTotal += row.months[m];
                                });

                                return (
                                    <TableRow key={idx} className="hover:bg-brand-sky/5 transition-colors border-b border-brand-sky/10">
                                        <TableCell className="text-sm font-semibold text-brand-charcoal">
                                            {row.name}
                                        </TableCell>
                                        {MONTHS.map((m) => {
                                            const hours = row.months[m];
                                            return (
                                                <TableCell key={m} className="text-center text-sm text-brand-sage font-medium">
                                                    {hours || "0"}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="text-right font-bold text-brand-teal">
                                            {rowTotal} hrs
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
