"use client";
import { useState } from "react";
import { CommsProfile, KeyMessage, CommsItem, CommsFaq, CommsFrame, CallToAction } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { formatDate } from "@/lib/date";
import { ChevronDown, ChevronUp } from "lucide-react";

type CommsViewProps = {
    project: {
        id: string;
        name: string;
        slug: string;
        status: string;
        primaryOwnerName?: string | null;
        asanaProjectGid: string | null;
        caseForChangePageUrl: string | null;
    };
    commsProfile: (CommsProfile & {
        keyMessages: KeyMessage[];
        callsToAction: CallToAction[];
        commsFrames: CommsFrame[];
        commsFaqs: CommsFaq[];
    }) | null;
    commsItems: (CommsItem & { owner?: { name: string } | null })[];
    canEdit: boolean;
    currentUser?: { email: string; name: string } | null;
};

export function CommsView({ project, commsProfile, commsItems, currentUser }: CommsViewProps) {
    return (
        <div className="space-y-6">
            <ProjectHeader
                project={{
                    name: project.name,
                    status: project.status,
                    primaryOwnerName: project.primaryOwnerName ?? null,
                    asanaProjectGid: project.asanaProjectGid,
                    caseForChangePageUrl: project.caseForChangePageUrl
                }}
                projectSlug={project.slug}
                currentUser={currentUser}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="md:col-span-2 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Strategy & Narrative</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Local Narrative</h4>
                            <p className="text-sm leading-relaxed">{commsProfile?.localNarrative || "No narrative defined yet."}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Messaging Watchouts</h4>
                            <p className="text-sm leading-relaxed italic">{commsProfile?.messagingWatchouts || "None specified."}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Risk & Mindfields</h4>
                            <p className="text-sm leading-relaxed text-destructive/80 font-medium">{commsProfile?.riskAndMinefields || "None specified."}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Key messages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {commsProfile?.keyMessages.length ? (
                            commsProfile.keyMessages.map((msg, i) => (
                                <div key={msg.id} className="flex gap-3">
                                    <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No key messages defined.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline of Comms Moments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {commsItems.length ? (
                                commsItems.map((item) => (
                                    <div key={item.id} className="relative flex items-center gap-6 pl-10">
                                        <span className="absolute left-0 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm ml-[12px]" />
                                        <div className="flex-1 rounded-lg border bg-muted/20 p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold text-sm">{item.title}</p>
                                                <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{item.plannedDate ? formatDate(item.plannedDate) : "TBD"}</span>
                                                <span>•</span>
                                                <span>{item.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic pl-10">No comms moments scheduled.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>FAQs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {commsProfile?.commsFaqs.length ? (
                            <div className="space-y-2">
                                {commsProfile.commsFaqs.map((faq) => (
                                    <FaqItem key={faq.id} faq={faq} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No FAQs added yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function FaqItem({ faq }: { faq: CommsFaq }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border rounded-lg overflow-hidden border-brand-sky/20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 text-left bg-brand-sky/5 hover:bg-brand-sky/10 transition-colors"
            >
                <span className="font-semibold text-sm">Q: {faq.question}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-brand-sage" /> : <ChevronDown className="h-4 w-4 text-brand-sage" />}
            </button>
            {isOpen && (
                <div className="p-3 bg-white border-t border-brand-sky/10">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        <span className="font-bold text-brand-charcoal mr-1">A:</span>
                        {faq.answer}
                    </p>
                </div>
            )}
        </div>
    );
}
