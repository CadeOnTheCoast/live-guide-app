import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

interface TimelineItem {
    year: string;
    title?: string;
    content: string;
}

function parseHistoryToTimeline(text: string): TimelineItem[] {
    // Split by sentences but keep delimiters to reattach if needed, 
    // though simple splitting by ". " usually works for this specific content.
    // We want to handle "In 2012," "In 2023," etc.

    const items: TimelineItem[] = [];
    const sentences = text.split(/(?<=[.?!])\s+/);

    let currentYear = "";
    let currentContent = "";

    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;

        // Detect years
        // Patterns: "In 2012,", "From 1986-2012", "In 2023,"
        const yearMatch = trimmed.match(/(?:In|From)\s+(\d{4}(?:-\d{4})?)/) || trimmed.match(/^(\d{4})\b/);
        const foundYear = yearMatch ? yearMatch[1] : null;

        if (foundYear) {
            // If we have a pending item, push it
            if (currentContent) {
                items.push({ year: currentYear || "General", content: currentContent.trim() });
            }
            currentYear = foundYear;
            currentContent = trimmed;
            // Try to extract a title from the first few words? 
            // For now, let's just use the sentence as content.
            // Refinement: The user image has titles. We can try to infer them or just style the first phrase bold.
        } else {
            // Continuation of previous item
            if (currentContent) {
                currentContent += " " + trimmed;
            } else {
                // Start of first item if no year found yet
                currentContent = trimmed;
                // Try to find a year inside?
                const internalYear = trimmed.match(/(\d{4}-\d{4})/);
                if (internalYear) currentYear = internalYear[1];
            }
        }
    }

    // Push last item
    if (currentContent) {
        items.push({ year: currentYear || "Context", content: currentContent.trim() });
    }

    return items;
}

export function HistoryDebriefCard({ historyDebrief, canEdit }: { historyDebrief: string | null, canEdit: boolean }) {
    if (!historyDebrief) {
        return (
            <Card className="border-brand-sky/20 shadow-sm overflow-hidden h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sky/10 bg-brand-charcoal text-white pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-sky">
                            <History className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sky/60">Legacy Context</p>
                            <CardTitle className="font-rajdhani text-xl">History Debrief</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground italic py-4">No historical debrief provided yet.</p>
                    {canEdit && (
                        <p className="text-[10px] text-muted-foreground italic mt-2">Tip: Add the history debrief in Project Settings.</p>
                    )}
                </CardContent>
            </Card>
        );
    }

    const timelineItems = parseHistoryToTimeline(historyDebrief);

    return (
        <Card className="border-brand-sky/20 shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sky/10 bg-brand-charcoal text-white pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-sky">
                        <History className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sky/60">Legacy Context</p>
                        <CardTitle className="font-rajdhani text-xl">History Debrief</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-brand-sky/5 overflow-y-auto max-h-[500px]">
                <div className="divide-y divide-brand-sky/10">
                    {timelineItems.map((item, i) => (
                        <div key={i} className="group flex flex-col sm:flex-row p-4 gap-3 sm:gap-6 hover:bg-white/50 transition-colors">
                            <div className="sm:w-24 shrink-0 flex flex-col justify-start pt-0.5">
                                <span className="text-sm font-black font-rajdhani text-brand-teal tracking-wider">{item.year}</span>
                            </div>
                            <div className="flex-1 pb-1">
                                <p className="text-sm text-brand-charcoal/90 leading-relaxed font-medium">
                                    {item.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
