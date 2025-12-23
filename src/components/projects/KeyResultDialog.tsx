"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { KeyResult, KeyResultStatus } from "@prisma/client";
import {
    keyResultFormInitialState,
    type KeyResultFormState
} from "@/app/projects/[projectSlug]/overview/formState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Edit2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type KeyResultDialogProps = {
    projectId: string;
    objectiveId: string;
    slug: string;
    upsertAction: (prevState: KeyResultFormState, formData: FormData) => Promise<KeyResultFormState>;
    people: { id: string; name: string }[];
    departments: { id: string; name: string; code: string }[];
    keyResult?: Partial<KeyResult>;
    isNew?: boolean;
    trigger?: React.ReactNode;
};

export function KeyResultDialog({
    projectId,
    objectiveId,
    slug,
    upsertAction,
    people,
    departments,
    keyResult,
    isNew = false,
    trigger
}: KeyResultDialogProps) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useFormState<KeyResultFormState, FormData>(upsertAction, keyResultFormInitialState);

    // Close dialog on success
    if (state.success && open) {
        setOpen(false);
        state.success = false; // Reset to avoid re-closing
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={isNew ? "default" : "ghost"} size={isNew ? "sm" : "icon"} className={cn(isNew && "bg-brand-teal")}>
                        {isNew ? <><Plus className="h-4 w-4 mr-2" /> CREATE KR</> : <Edit2 className="h-4 w-4" />}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-rajdhani text-xl">{isNew ? "Create Key Result" : "Edit Key Result"}</DialogTitle>
                </DialogHeader>
                <form action={formAction} className="space-y-4 pt-4 font-montserrat">
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="objectiveId" value={objectiveId} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="keyResultId" value={keyResult?.id ?? ""} />

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1 space-y-2">
                            <Label htmlFor="code" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Code</Label>
                            <Input id="code" name="code" defaultValue={keyResult?.code ?? "KR1"} placeholder="KR1" className="h-9 px-2 uppercase font-bold" />
                            {state.errors?.code && <p className="text-[10px] text-destructive">{state.errors.code}</p>}
                        </div>
                        <div className="col-span-3 space-y-2">
                            <Label htmlFor="title" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Title</Label>
                            <Input id="title" name="title" defaultValue={keyResult?.title} placeholder="e.g. Reduce nitrogen by 20%" className="h-9" />
                            {state.errors?.title && <p className="text-[10px] text-destructive">{state.errors.title}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ownerId" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Owner</Label>
                            <select name="ownerId" id="ownerId" defaultValue={keyResult?.ownerId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                <option value="">Unassigned</option>
                                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="departmentId" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Department</Label>
                            <select name="departmentId" id="departmentId" defaultValue={keyResult?.departmentId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                <option value="">—</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-brand-sky/10 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="targetValue" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Target</Label>
                            <Input id="targetValue" name="targetValue" defaultValue={keyResult?.targetValue ?? ""} placeholder="100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currentValue" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Current</Label>
                            <Input id="currentValue" name="currentValue" defaultValue={keyResult?.currentValue ?? ""} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Unit</Label>
                            <Input id="unit" name="unit" defaultValue={keyResult?.unit ?? ""} placeholder="%" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Status</Label>
                            <select name="status" id="status" defaultValue={keyResult?.status ?? "GREEN"} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                {Object.values(KeyResultStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Due Date</Label>
                            <Input id="dueDate" name="dueDate" type="date" defaultValue={keyResult?.dueDate ? new Date(keyResult.dueDate).toISOString().split('T')[0] : ""} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-[10px] uppercase font-bold tracking-widest text-brand-sage">Notes / Context</Label>
                        <Textarea id="description" name="description" defaultValue={keyResult?.description ?? ""} placeholder="Describe what success looks like..." />
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-teal hover:bg-brand-teal/90">
                            {isNew ? "Create Key Result" : "Save Changes"}
                        </Button>
                    </div>
                    {state.formError && <p className="text-xs text-destructive text-center">{state.formError}</p>}
                </form>
            </DialogContent>
        </Dialog>
    );
}
