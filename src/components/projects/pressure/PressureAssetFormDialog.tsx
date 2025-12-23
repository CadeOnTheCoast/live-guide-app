"use client";

import { useState } from "react";
import { PressureAsset, PressureCorner, PowerRating } from "@prisma/client";
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
import { upsertPressureAsset } from "@/app/projects/[projectSlug]/pressure/actions";

type PressureAssetFormDialogProps = {
    projectId: string;
    decisionMakerId: string;
    asset?: PressureAsset;
    trigger?: React.ReactNode;
};

export function PressureAssetFormDialog({ projectId, decisionMakerId, asset, trigger }: PressureAssetFormDialogProps) {
    const [open, setOpen] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await upsertPressureAsset(formData);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm" className="h-7 px-2 text-xs">{asset ? "Edit" : "Add Asset"}</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{asset ? "Edit Pressure Asset" : "Add Pressure Asset"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="decisionMakerId" value={decisionMakerId} />
                    {asset && <input type="hidden" name="id" value={asset.id} />}

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" defaultValue={asset?.title} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="corner">Corner</Label>
                            <select
                                id="corner"
                                name="corner"
                                defaultValue={asset?.corner ?? PressureCorner.INFLUENCE}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {Object.values(PressureCorner).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="powerRating">Power Rating</Label>
                            <select
                                id="powerRating"
                                name="powerRating"
                                defaultValue={asset?.powerRating ?? PowerRating.MEDIUM}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {Object.values(PowerRating).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Input id="status" name="status" defaultValue={asset?.status ?? ""} placeholder="active, planned, etc." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="weight">Weight (impact multiplier)</Label>
                            <Input id="weight" name="weight" type="number" step="0.1" defaultValue={asset?.weight ?? 1.0} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={asset?.description ?? ""} />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">{asset ? "Update" : "Create"}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
