import { Badge } from "@/components/ui/badge";
import { ExternalLink, User } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectHeaderProps = {
  project: {
    name: string;
    status: string;
    primaryOwnerName?: string | null;
    asanaProjectGid?: string | null;
    asanaUrl?: string | null;
    teamsUrl?: string | null;
    projectFolderUrl?: string | null;
    projectNotesUrl?: string | null;
    caseForChangePageUrl?: string | null;
    badges?: string[];
  };
};

const BADGE_COLORS: Record<string, string> = {
  "Fish Consumption": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Swimming Safety": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Oyster Revival": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Oyster": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Seagrass Restoration": "bg-teal-500/10 text-teal-600 border-teal-500/20",
  "SAV": "bg-teal-500/10 text-teal-600 border-teal-500/20"
};

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const asanaLink = project.asanaUrl || (project.asanaProjectGid
    ? `https://app.asana.com/0/${project.asanaProjectGid}/list`
    : null);

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl bg-white border border-brand-sky/20 shadow-sm md:flex-row md:items-center md:justify-between relative overflow-hidden group">
      {/* Decorative Brand Accent */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-teal"></div>

      <div className="space-y-4 relative z-10 w-full md:w-auto">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-4xl font-black font-rajdhani text-brand-charcoal tracking-tight">{project.name}</h2>
          <Badge className={cn(
            "px-3 py-1 text-[10px] font-bold tracking-widest border-none shadow-none",
            project.status === "ACTIVE" ? "bg-brand-mint text-brand-charcoal" : "bg-brand-sky text-brand-charcoal"
          )}>
            {project.status}
          </Badge>
        </div>

        {project.badges && project.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.badges.map((badge) => (
              <Badge
                key={badge}
                variant="outline"
                className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", BADGE_COLORS[badge] || "bg-gray-100 text-gray-600 border-gray-200")}
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-brand-sage">
          <div className="h-6 w-6 rounded-full bg-brand-sky/10 flex items-center justify-center">
            <User className="h-3 w-3" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest">
            OWNER: <span className="text-brand-charcoal ml-1">{project.primaryOwnerName ?? "UNASSIGNED"}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 relative z-10">
        {asanaLink && (
          <a
            href={asanaLink}
            className="flex items-center gap-2 rounded-xl bg-brand-charcoal px-4 py-2 text-[10px] font-bold font-rajdhani tracking-widest text-white hover:bg-black transition-all shadow-md group/btn"
            target="_blank"
            rel="noreferrer"
          >
            ASANA
            <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </a>
        )}
        {project.teamsUrl && (
          <a
            href={project.teamsUrl}
            className="flex items-center gap-2 rounded-xl bg-[#444791] px-4 py-2 text-[10px] font-bold font-rajdhani tracking-widest text-white hover:opacity-90 transition-all shadow-md group/btn"
            target="_blank"
            rel="noreferrer"
          >
            TEAMS
            <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </a>
        )}
        {project.projectNotesUrl && (
          <a
            href={project.projectNotesUrl}
            className="flex items-center gap-2 rounded-xl bg-[#77152C] px-4 py-2 text-[10px] font-bold font-rajdhani tracking-widest text-white hover:opacity-90 transition-all shadow-md group/btn"
            target="_blank"
            rel="noreferrer"
          >
            NOTES
            <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </a>
        )}
        {project.projectFolderUrl && (
          <a
            href={project.projectFolderUrl}
            className="flex items-center gap-2 rounded-xl bg-[#0078D4] px-4 py-2 text-[10px] font-bold font-rajdhani tracking-widest text-white hover:opacity-90 transition-all shadow-md group/btn"
            target="_blank"
            rel="noreferrer"
          >
            FILES
            <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </a>
        )}
        {project.caseForChangePageUrl && (
          <a
            href={project.caseForChangePageUrl}
            className="flex items-center gap-2 rounded-xl border border-brand-sky px-4 py-2 text-[10px] font-bold font-rajdhani tracking-widest text-brand-charcoal hover:bg-brand-sky/5 transition-all shadow-sm"
            target="_blank"
            rel="noreferrer"
          >
            CASE FOR CHANGE
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
