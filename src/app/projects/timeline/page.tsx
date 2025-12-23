import { MasterTimelineView } from "@/components/projects/timeline/MasterTimelineView";
import { getAllProjectsWithTimelineData } from "@/server/projects";

export default async function MasterTimelinePage() {
    const projects = await getAllProjectsWithTimelineData();

    // Map data to the shape expected by MasterTimelineView
    const mappedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        milestones: p.milestones.map(m => ({
            id: m.id,
            title: m.title,
            date: m.date,
            status: m.status,
            isMajor: m.isMajor
        })),
        keyResults: p.keyResults.map(kr => ({
            id: kr.id,
            code: kr.code,
            title: kr.title,
            dueDate: kr.dueDate,
            status: kr.status
        }))
    }));

    return (
        <div className="p-6">
            <MasterTimelineView projects={mappedProjects} />
        </div>
    );
}
