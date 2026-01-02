"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { updateBudgetLine, addBudgetComment } from "@/app/projects/[projectSlug]/budget/actions";
import { MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface BudgetLine {
    id: string;
    category: string;
    description: string;
    amount: number;
    unitCost: number | null;
    quantity: number | null;
    period: string;
    notes: string | null;
    comments?: { text: string; author: { name: string } }[];
}

interface BudgetTableProps {
    budgetLines: BudgetLine[];
    projectSlug: string;
    canEdit: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function BudgetTable({ budgetLines, projectSlug, canEdit }: BudgetTableProps) {
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
    const [commentText, setCommentText] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (key: string) => {
        const next = new Set(expandedRows);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        setExpandedRows(next);
    };

    // Grouping logic
    const groupedRows: Record<string, {
        category: string;
        description: string;
        unitCost: number | null;
        quantity: number | null;
        notes: string | null;
        months: Record<string, { id: string; amount: number }>;
    }> = {};
    budgetLines.forEach((line) => {
        const key = `${line.category}-${line.description}`;
        if (!groupedRows[key]) {
            groupedRows[key] = {
                category: line.category,
                description: line.description,
                unitCost: line.unitCost,
                quantity: line.quantity,
                notes: line.notes,
                months: {},
            };
        }
        const month = line.period.split(" ")[0];
        groupedRows[key].months[month] = { id: line.id, amount: line.amount };
    });

    const handleUpdate = async (id: string, value: string) => {
        const amount = parseFloat(value);
        if (isNaN(amount)) return;
        try {
            await updateBudgetLine({ id, amount, slug: projectSlug });
        } catch (error) {
            console.error("Failed to update budget line:", error);
        }
        setEditingCell(null);
    };

    const handleComment = async (id: string) => {
        if (!commentText.trim()) return;
        try {
            await addBudgetComment({ budgetLineId: id, text: commentText, slug: projectSlug });
            setCommentText("");
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    return (
        <div className="rounded-2xl border border-brand-sky/20 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-brand-sky/10">
                        <TableRow className="border-b border-brand-sky/20">
                            <TableHead className="w-[100px] font-bold text-brand-charcoal text-[10px] uppercase tracking-widest">Account</TableHead>
                            <TableHead className="w-[250px] font-bold text-brand-charcoal text-[10px] uppercase tracking-widest">Description</TableHead>
                            {MONTHS.map((m) => (
                                <TableHead key={m} className="w-[100px] text-center font-bold text-brand-charcoal text-[10px] uppercase tracking-widest">{m}</TableHead>
                            ))}
                            <TableHead className="w-[120px] text-right font-bold text-brand-charcoal text-[10px] uppercase tracking-widest">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.values(groupedRows).map((row, idx) => {
                            let rowTotal = 0;
                            MONTHS.forEach((m) => {
                                if (row.months[m]) {
                                    const amt = Number(row.months[m].amount) || 0;
                                    rowTotal += amt;
                                }
                            });

                            return (
                                <TableRow key={idx} className="hover:bg-brand-sky/5 transition-colors border-b border-brand-sky/10">
                                    <TableCell className="font-mono text-xs text-brand-sage">{row.category}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-brand-charcoal">{row.description}</span>
                                            {row.notes && (
                                                <div className="mt-1">
                                                    <button
                                                        onClick={() => toggleRow(key)}
                                                        className="text-[10px] text-brand-teal font-bold uppercase tracking-widest flex items-center gap-1 hover:underline focus:outline-none"
                                                    >
                                                        <Info className="h-3 w-3" />
                                                        {expandedRows.has(key) ? "Hide Details" : "Show Details"}
                                                    </button>
                                                    {expandedRows.has(key) && (
                                                        <div className="mt-2 text-[11px] text-brand-sage bg-brand-sky/5 p-2 rounded-lg border border-brand-sky/10 whitespace-pre-wrap font-medium">
                                                            {row.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    {MONTHS.map((m) => {
                                        const line = row.months[m];
                                        const isEditing = editingCell?.id === line?.id;

                                        return (
                                            <TableCell key={m} className="text-center p-0">
                                                {line ? (
                                                    isEditing && canEdit ? (
                                                        <input
                                                            autoFocus
                                                            type="number"
                                                            defaultValue={Number(line.amount)}
                                                            className="w-full h-12 text-center text-sm border-none focus:ring-2 focus:ring-brand-teal bg-brand-sky/5 font-medium"
                                                            onBlur={(e) => handleUpdate(line.id, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleUpdate(line.id, e.currentTarget.value);
                                                                if (e.key === "Escape") setEditingCell(null);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            onClick={() => canEdit && setEditingCell({ id: line.id, field: "amount" })}
                                                            className={cn(
                                                                "h-12 flex items-center justify-center text-sm font-medium transition-colors cursor-default",
                                                                canEdit && "hover:bg-brand-sky/10 cursor-pointer"
                                                            )}
                                                        >
                                                            ${Number(line.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="h-12 flex items-center justify-center text-brand-sky/30 text-xs">—</div>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell className="text-right font-bold text-brand-teal bg-brand-mint/5">
                                        ${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-sky hover:text-brand-teal hover:bg-brand-teal/10">
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle className="text-brand-charcoal font-rajdhani">Comments for {row.description}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <Textarea
                                                        placeholder="Add a comment... (this will notify project members)"
                                                        className="resize-none min-h-[100px] border-brand-sky/30 focus:border-brand-teal"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button
                                                            onClick={() => handleComment((Object.values(row.months)[0] as { id: string }).id)} // For simplicity using the first month's ID as reference
                                                            className="bg-brand-teal hover:bg-brand-teal/90 text-white font-bold tracking-widest text-[10px]"
                                                        >
                                                            SEND NOTIFICATION
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
