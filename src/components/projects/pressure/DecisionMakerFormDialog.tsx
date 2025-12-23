"use client";

import { useState } from "react";
import { DecisionMaker } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertDecisionMaker } from "@/app/projects/[projectSlug]/pressure/actions";

type DecisionMakerFormDialogProps = {
    projectId: string;
    decisionMaker?: DecisionMaker;
    trigger?: React.ReactNode;
};

export function DecisionMakerFormDialog({ projectId, decisionMaker, trigger }: DecisionMakerFormDialogProps) {
    const [open, setOpen] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await upsertDecisionMaker(formData);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm">{decisionMaker ? "Edit DM" : "Add DM"}</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{decisionMaker ? "Edit Decision Maker" : "Add Decision Maker"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <input type="hidden" name="projectId" value={projectId} />
                    {decisionMaker && <input type="hidden" name="id" value={decisionMaker.id} />}

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={decisionMaker?.name} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={decisionMaker?.title ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="organization">Organization</Label>
                            <Input id="organization" name="organization" defaultValue={decisionMaker?.organization ?? ""} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="jurisdiction">Jurisdiction</Label>
                            <Input id="jurisdiction" name="jurisdiction" defaultValue={decisionMaker?.jurisdiction ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priorityLevel">Priority Level</Label>
                            <Input id="priorityLevel" name="priorityLevel" defaultValue={decisionMaker?.priorityLevel ?? ""} placeholder="high, medium, low" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stance">Stance</Label>
                        <Input id="stance" name="stance" defaultValue={decisionMaker?.stance ?? ""} placeholder="supportive, neutral, opposed" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" defaultValue={decisionMaker?.notes ?? ""} />
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-4">Detailed Relationship Data</p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Strategic Reason (Why are they on the board?)</Label>
                                <Textarea id="reason" name="reason" defaultValue={decisionMaker?.reason ?? ""} placeholder="e.g. Primary permitting authority for..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pressurePoints">Targeted Pressure Points</Label>
                                <Input id="pressurePoints" name="pressurePoints" defaultValue={decisionMaker?.pressurePoints ?? ""} placeholder="e.g. Public image, donor base, etc." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="influencers">Key Influencer(s)</Label>
                                <Input id="influencers" name="influencers" defaultValue={decisionMaker?.influencers ?? ""} placeholder="Who does this person listen to?" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="everyActionUrl">EveryAction CRM URL</Label>
                                <Input id="everyActionUrl" name="everyActionUrl" type="url" defaultValue={decisionMaker?.everyActionUrl ?? ""} placeholder="https://..." />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">{decisionMaker ? "Update" : "Create"}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
