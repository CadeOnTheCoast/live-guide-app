import { db } from "@/server/db";
import { getProjectBySlug } from "@/server/projects";
import { notFound } from "next/navigation";
import { BudgetTable } from "@/components/projects/budget/BudgetTable";
import { BudgetSummary } from "@/components/projects/budget/BudgetSummary";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { StaffAllocationTable } from "@/components/projects/budget/StaffAllocationTable";

export default async function BudgetPage({
  params
}: {
  params: { projectSlug: string };
}) {
  const { person } = await getUserOrRedirect();
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) {
    notFound();
  }

  const budgetLines = await db.budgetLine.findMany({
    where: { projectId: project.id },
    include: {
      comments: {
        include: {
          author: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { category: "asc" }
  });

  const staffAllocations = await db.staffAllocation.findMany({
    where: { projectId: project.id },
    include: {
      person: { select: { name: true, email: true } }
    },
    orderBy: { person: { name: "asc" } }
  });

  const canEdit = canEditProject(person?.role);

  // Map project for ProjectHeader
  const headerProject = {
    ...project,
    primaryOwnerName: project.primaryOwner?.name
  };

  return (
    <div className="space-y-8 pb-12">
      <ProjectHeader project={headerProject} projectSlug={params.projectSlug} currentUser={person} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-rajdhani text-brand-charcoal uppercase tracking-widest text-brand-teal flex items-center gap-3">
            <div className="h-0.5 w-8 bg-brand-teal" />
            Financial Overview
          </h2>
        </div>
        <BudgetSummary budgetLines={budgetLines} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-rajdhani text-brand-charcoal uppercase tracking-widest text-brand-teal flex items-center gap-3">
            <div className="h-0.5 w-8 bg-brand-teal" />
            Staff Allocation
          </h2>
        </div>
        <StaffAllocationTable allocations={staffAllocations} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-rajdhani text-brand-charcoal uppercase tracking-widest text-brand-teal flex items-center gap-3">
            <div className="h-0.5 w-8 bg-brand-teal" />
            Budget Breakout
          </h2>
        </div>
        <BudgetTable budgetLines={budgetLines} projectSlug={params.projectSlug} canEdit={canEdit} />
      </div>
    </div>
  );
}
