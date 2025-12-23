"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectHeader } from "@/components/projects/ProjectHeader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseForChangeView({ project }: { project: any }) {
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
            />

            <Card>
                <CardHeader>
                    <CardTitle>Case for Change</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose max-w-none">
                        <h3 className="text-lg font-semibold mb-2">Summary</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {project.caseForChangeSummary || "The Case for Change summary has not been defined for this project yet. Use this space to outline the core problem, the proposed solution, and the anticipated impact of this initiative."}
                        </p>
                    </div>

                    <div className="p-10 border-2 border-dashed rounded-xl bg-muted/30 text-center flex flex-col items-center justify-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="font-medium">Strategic Dashboard / Visualization</p>
                        <p className="text-sm text-muted-foreground mt-2">Upload a strategic overview image or link a dynamic dashboard here.</p>
                        {project.caseForChangePageUrl && (
                            <a href={project.caseForChangePageUrl} className="mt-4 text-primary underline text-sm" target="_blank" rel="noreferrer">
                                View linked dashboard
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
