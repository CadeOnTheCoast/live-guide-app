"use client";

import { useState } from "react";
import { Stakeholder, StakeholderType } from "@prisma/client";
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
import { Select } from "@/components/ui/select";
import { upsertStakeholder } from "@/app/projects/[projectSlug]/pressure/actions";

type StakeholderFormDialogProps = {
    projectId: string;
    stakeholder?: Stakeholder;
    trigger?: React.ReactNode;
};

export function StakeholderFormDialog({ projectId, stakeholder, trigger }: StakeholderFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<StakeholderType>(stakeholder?.stakeholderType || StakeholderType.ALLY);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await upsertStakeholder(formData);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm">{stakeholder ? "Edit Relationship" : "Add Relationship"}</Button>}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{stakeholder ? "Edit Relationship" : "Add Relationship"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <input type="hidden" name="projectId" value={projectId} />
                    {stakeholder && <input type="hidden" name="id" value={stakeholder.id} />}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" defaultValue={stakeholder?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stakeholderType">Type</Label>
                            <Select
                                id="stakeholderType"
                                name="stakeholderType"
                                defaultValue={type}
                                onValueChange={(v) => setType(v as StakeholderType)}
                            >
                                <option value={StakeholderType.ALLY}>Ally</option>
                                <option value={StakeholderType.COMMUNITY_LEADER}>Community Leader</option>
                                <option value={StakeholderType.INFLUENCER}>Influencer</option>
                                <option value={StakeholderType.OPPONENT}>Opponent</option>
                                <option value={StakeholderType.MEDIA_OUTLET}>Media Outlet</option>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="organization">Organization / Affiliation</Label>
                        <Input id="organization" name="organization" defaultValue={stakeholder?.organization ?? ""} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Strategic Reason (Why track this?)</Label>
                        <Textarea id="reason" name="reason" defaultValue={stakeholder?.reason ?? ""} rows={2} />
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-4">Type-Specific Data</p>

                        {(type === StakeholderType.ALLY || type === StakeholderType.COMMUNITY_LEADER || type === StakeholderType.INFLUENCER) && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="captains">Captains (Affirmed or Potential)</Label>
                                    <Input id="captains" name="captains" defaultValue={stakeholder?.captains ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="planToEducate">Plan to Educate</Label>
                                    <Textarea id="planToEducate" name="planToEducate" defaultValue={stakeholder?.planToEducate ?? ""} rows={2} />
                                </div>
                            </div>
                        )}

                        {type === StakeholderType.OPPONENT && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="influencers">Influencer(s)</Label>
                                    <Input id="influencers" name="influencers" defaultValue={stakeholder?.influencers ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="planToCounter">Plan to Counter</Label>
                                    <Textarea id="planToCounter" name="planToCounter" defaultValue={stakeholder?.planToCounter ?? ""} rows={2} />
                                </div>
                            </div>
                        )}

                        {type === StakeholderType.MEDIA_OUTLET && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="audience">Target Audience</Label>
                                    <Input id="audience" name="audience" defaultValue={stakeholder?.audience ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan">Media Plan</Label>
                                    <Textarea id="plan" name="plan" defaultValue={stakeholder?.plan ?? ""} rows={2} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="everyActionUrl">EveryAction CRM URL</Label>
                        <Input id="everyActionUrl" name="everyActionUrl" type="url" defaultValue={stakeholder?.everyActionUrl ?? ""} placeholder="https://..." />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea id="notes" name="notes" defaultValue={stakeholder?.notes ?? ""} rows={2} />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">{stakeholder ? "Update" : "Create"}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
