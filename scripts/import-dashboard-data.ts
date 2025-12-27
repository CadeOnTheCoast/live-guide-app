/**
 * TODO: The current Prisma schema does not define several CSV-backed entities (pressure sources, opponents, comms plan items,
 * and explicit pressure-source/decision-maker identifiers). These sheets are detected but skipped until matching models exist.
 * The schema also lacks a defaultDepartmentCode on Project; this field is currently ignored.
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  Prisma,
  PrismaClient,
  ProjectStatus,
  ObjectiveStatus,
  KeyResultStatus,
  MilestoneStatus,
  ActivityStatus,
  AudienceType,
  CallToActionStatus,
  UserRole,
} from "@prisma/client";

type SheetType =
  | "projects"
  | "people"
  | "objectives"
  | "keyResults"
  | "pushes"
  | "milestones"
  | "activities"
  | "decisionMakers"
  | "pressureSources"
  | "opponents"
  | "commsProfile"
  | "keyMessages"
  | "ctas"
  | "commsFrames"
  | "faqs"
  | "budget"
  | "staffAllocation";

interface ImportOptions {
  baseDir?: string;
  prisma?: PrismaClient;
}

interface ImportStats {
  upserted: Record<string, number>;
  skipped: Record<string, number>;
  warnings: string[];
}

interface SheetPaths {
  [key: string]: string | undefined;
}

interface ParsedRow {
  [key: string]: string | null;
}

type NullableDate = Date | null;

const SHEET_TOKENS: Record<SheetType, RegExp[]> = {
  projects: [/projects?/i],
  people: [/people/i],
  objectives: [/objective/i],
  keyResults: [/key_results?/i, /keyresults/i],
  pushes: [/pushes?/i],
  milestones: [/milestones?/i],
  activities: [/activities/i, /tasks/i],
  decisionMakers: [/decision_makers?/i, /decisionmakers?/i],
  pressureSources: [/pressure_sources?/i, /pressuresources?/i],
  opponents: [/opponents?/i],
  commsProfile: [/comms_profile/i],
  keyMessages: [/key_messages/i],
  ctas: [/ctas/i, /calls_to_action/i],
  commsFrames: [/comms_frames/i],
  faqs: [/faqs/i],
  budget: [/budget/i],
  staffAllocation: [/staff_allocation/i],
};

function initStats(): ImportStats {
  return { upserted: {}, skipped: {}, warnings: [] };
}

function increment(map: Record<string, number>, key: string, delta = 1) {
  map[key] = (map[key] ?? 0) + delta;
}

function parseCsv(filePath: string): ParsedRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    const records = parse(raw, {
      columns: (header) => header.map((h: string) => h.replace(/^\ufeff/, "").trim()),
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    return (records as Record<string, string>[]).map((record) => {
      const normalized: ParsedRow = {};
      for (const [key, value] of Object.entries(record)) {
        if (value === undefined) continue;
        const normalizedKey = key.trim();
        const normalizedValue = typeof value === "string" ? value.trim() : value;
        normalized[normalizedKey] = normalizedValue === "" ? null : String(normalizedValue);
      }
      return normalized;
    });
  } catch (error) {
    throw new Error(`Failed to parse CSV ${filePath}: ${(error as Error).message}`);
  }
}

function parseDate(value: string | null): NullableDate {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseBoolean(value: string | null): boolean | null {
  if (!value) return null;
  const lowered = value.toLowerCase();
  return lowered === "true" || lowered === "1" || lowered === "yes";
}

function normalizeEnum<T extends string>(value: string | null, enumObject: Record<string, T>): T | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return (enumObject as Record<string, T>)[upper] ?? null;
}

function findSheetPaths(projectDir: string): SheetPaths {
  const files = fs.readdirSync(projectDir);
  const matches: SheetPaths = {};

  for (const file of files) {
    const filePath = path.join(projectDir, file);
    if (fs.statSync(filePath).isDirectory()) continue;
    if (!file.toLowerCase().endsWith(".csv")) continue;

    for (const [sheet, patterns] of Object.entries(SHEET_TOKENS)) {
      if (matches[sheet]) continue;
      if (patterns.some((regex) => regex.test(file))) {
        matches[sheet] = filePath;
        break;
      }
    }
  }

  return matches;
}

async function ensureDepartment(prisma: PrismaClient, code: string | null, cache: Map<string, string>): Promise<string | null> {
  if (!code) return null;
  const normalizedCode = code.trim();
  if (cache.has(normalizedCode)) return cache.get(normalizedCode)!;

  const department = await prisma.department.upsert({
    where: { code: normalizedCode },
    update: { name: normalizedCode },
    create: { code: normalizedCode, name: normalizedCode },
  });
  cache.set(normalizedCode, department.id);
  return department.id;
}

async function ensureProject(
  prisma: PrismaClient,
  slug: string,
  createData: Prisma.ProjectUncheckedCreateInput,
  updateData: Prisma.ProjectUncheckedUpdateInput,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const project = await prisma.project.upsert({
    where: { slug },
    update: updateData,
    create: createData,
  });
  projectCache.set(slug, project.id);
  increment(stats.upserted, "Project");
  return project;
}

async function findObjectiveByTitle(prisma: PrismaClient, projectId: string, title: string) {
  return prisma.objective.findFirst({ where: { projectId, title } });
}

async function upsertObjective(
  prisma: PrismaClient,
  projectId: string,
  payload: Omit<Prisma.ObjectiveCreateInput, "project">,
  stats: ImportStats
) {
  const existing = await findObjectiveByTitle(prisma, projectId, payload.title);
  if (existing) {
    await prisma.objective.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.objective.create({ data: { ...payload, project: { connect: { id: projectId } } } });
  }
  increment(stats.upserted, "Objective");
}

async function upsertPush(
  prisma: PrismaClient,
  projectId: string,
  sequenceIndex: number,
  data: Omit<Prisma.PushCreateInput, "project" | "sequenceIndex">,
  stats: ImportStats
) {
  const existing = await prisma.push.findFirst({ where: { projectId, sequenceIndex } });
  if (existing) {
    await prisma.push.update({ where: { id: existing.id }, data });
  } else {
    await prisma.push.create({ data: { ...data, project: { connect: { id: projectId } }, sequenceIndex } });
  }
  increment(stats.upserted, "Push");
}

async function upsertMilestone(
  prisma: PrismaClient,
  projectId: string,
  title: string,
  data: Omit<Prisma.MilestoneCreateInput, "project" | "title">,
  stats: ImportStats
) {
  const existing = await prisma.milestone.findFirst({ where: { projectId, title } });
  if (existing) {
    await prisma.milestone.update({ where: { id: existing.id }, data });
  } else {
    await prisma.milestone.create({ data: { ...data, project: { connect: { id: projectId } }, title } });
  }
  increment(stats.upserted, "Milestone");
}

async function upsertDecisionMaker(
  prisma: PrismaClient,
  projectId: string,
  name: string,
  data: Omit<Prisma.DecisionMakerCreateInput, "project" | "name">,
  stats: ImportStats
) {
  const existing = await prisma.decisionMaker.findFirst({ where: { projectId, name } });
  if (existing) {
    await prisma.decisionMaker.update({ where: { id: existing.id }, data });
  } else {
    await prisma.decisionMaker.create({ data: { ...data, project: { connect: { id: projectId } }, name } });
  }
  increment(stats.upserted, "DecisionMaker");
}

async function upsertBudgetLine(
  prisma: PrismaClient,
  projectId: string,
  category: string,
  period: string,
  data: Omit<Prisma.BudgetLineCreateInput, "project" | "category" | "period">,
  stats: ImportStats
) {
  const existing = await prisma.budgetLine.findFirst({ where: { projectId, category, period } });
  if (existing) {
    await prisma.budgetLine.update({ where: { id: existing.id }, data });
  } else {
    await prisma.budgetLine.create({ data: { ...data, project: { connect: { id: projectId } }, category, period } });
  }
  increment(stats.upserted, "BudgetLine");
}

async function upsertStaffAllocation(
  prisma: PrismaClient,
  projectId: string,
  personId: string,
  period: string,
  data: Omit<Prisma.StaffAllocationCreateInput, "project" | "person" | "period">,
  stats: ImportStats
) {
  const existing = await prisma.staffAllocation.findFirst({ where: { projectId, personId, period } });
  if (existing) {
    await prisma.staffAllocation.update({ where: { id: existing.id }, data });
  } else {
    await prisma.staffAllocation.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
        person: { connect: { id: personId } },
        period,
      },
    });
  }
  increment(stats.upserted, "StaffAllocation");
}

async function upsertActivity(
  prisma: PrismaClient,
  projectId: string,
  pushId: string,
  title: string,
  data: Omit<Prisma.ActivityCreateInput, "project" | "push" | "title">,
  stats: ImportStats
) {
  const existing = await prisma.activity.findFirst({ where: { projectId, pushId, title } });
  if (existing) {
    await prisma.activity.update({ where: { id: existing.id }, data });
  } else {
    await prisma.activity.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
        push: { connect: { id: pushId } },
        title,
      },
    });
  }
  increment(stats.upserted, "Activity");
}

async function upsertCommsProfile(
  prisma: PrismaClient,
  projectId: string,
  data: Omit<Prisma.CommsProfileCreateInput, "project">,
  stats: ImportStats
) {
  const existing = await prisma.commsProfile.findUnique({ where: { projectId } });
  if (existing) {
    await prisma.commsProfile.update({ where: { id: existing.id }, data });
    return existing.id;
  } else {
    const profile = await prisma.commsProfile.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
      },
    });
    increment(stats.upserted, "CommsProfile");
    return profile.id;
  }
}

function logUnused(record: ParsedRow, usedKeys: Set<string>, warnings: string[], context: string) {
  for (const key of Object.keys(record)) {
    if (!usedKeys.has(key)) {
      warnings.push(`Unused column in ${context}: ${key}`);
    }
  }
}

async function processPeople(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  departmentCache: Map<string, string>,
  personCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set(["name", "email", "department_code", "role"]);
    logUnused(row, used, stats.warnings, `${projectDir}/People`);

    const email = row.email;
    if (!email) {
      increment(stats.skipped, "Person");
      continue;
    }

    const departmentId = await ensureDepartment(prisma, row.department_code, departmentCache);
    const role = normalizeEnum(row.role, UserRole);

    if (!role) {
      stats.warnings.push(`Unknown person role for ${email}: ${row.role}`);
    }

    const person = await prisma.person.upsert({
      where: { email },
      update: {
        name: row.name ?? email,
        role: (role as any) ?? undefined,
        defaultDepartmentId: departmentId ?? undefined,
      },
      create: {
        email,
        name: row.name ?? email,
        role: (role as any) ?? undefined,
        defaultDepartmentId: departmentId ?? undefined,
      },
    });
    personCache.set(email, person.id);
    increment(stats.upserted, "Person");
  }
}

async function processProjects(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  personCache: Map<string, string>,
  projectCache: Map<string, string>,
  departmentCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "project_name",
      "status",
      "start_date",
      "primary_owner_email",
      "short_description",
      "case_for_change_summary",
      "case_for_change_link",
      "default_department_code",
      "asana_workspace_gid",
      "asana_project_gid",
      "asana_project_gid",
      "asana_team_gid",
      "teams_url",
      "asana_url",
      "files_url",
      "notes_url",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/Projects`);

    const slug = row.project_slug;
    if (!slug) {
      increment(stats.skipped, "Project");
      continue;
    }


    const status = normalizeEnum(row.status, ProjectStatus) ?? ProjectStatus.ACTIVE;
    if (slug === 'claiborne-millers-ferry-dam-impact-assessment' || slug === 'mud-dumping') {
      console.log(`Debug ${slug}:`, {
        teams: row.teams_url,
        asana: row.asana_url,
        files: row.files_url,
        notes: row.notes_url
      });
    }
    const startDate = parseDate(row.start_date);
    const primaryOwnerId = row.primary_owner_email
      ? personCache.get(row.primary_owner_email) ?? (await prisma.person.findUnique({ where: { email: row.primary_owner_email } }))?.id
      : null;

    await ensureDepartment(prisma, row.default_department_code, departmentCache);

    const workspaceGid = row.asana_workspace_gid ?? "52630705087449";
    const teamGid = row.asana_team_gid ?? "1208642902759881";

    const createData: Prisma.ProjectUncheckedCreateInput = {
      slug,
      name: row.project_name ?? slug,
      status,
      startDate: startDate ?? null,
      description: row.short_description ?? null,
      caseForChangeSummary: row.case_for_change_summary ?? null,
      caseForChangePageUrl: row.case_for_change_link ?? null,
      primaryOwnerId: primaryOwnerId ?? null,
      asanaWorkspaceGid: workspaceGid,
      asanaProjectGid: row.asana_project_gid ?? null,
      asanaTeamGid: teamGid,
      teamsUrl: row.teams_url ?? null,
      asanaUrl: row.asana_url ?? null,
      projectFolderUrl: row.files_url ?? null,
      projectNotesUrl: row.notes_url ?? null,
      projectUpdateAgendaUrl: row.project_update_agenda_url ?? null,
    };

    const updateData: Prisma.ProjectUncheckedUpdateInput = {
      name: row.project_name ?? slug,
      status,
      startDate: startDate ?? null,
      description: row.short_description ?? null,
      caseForChangeSummary: row.case_for_change_summary ?? null,
      caseForChangePageUrl: row.case_for_change_link ?? null,
      primaryOwnerId: primaryOwnerId ?? null,
      asanaWorkspaceGid: workspaceGid,
      asanaProjectGid: row.asana_project_gid ?? null,
      asanaTeamGid: teamGid,
      teamsUrl: row.teams_url ?? null,
      asanaUrl: row.asana_url ?? null,
      projectFolderUrl: row.files_url ?? null,
      projectNotesUrl: row.notes_url ?? null,
      projectUpdateAgendaUrl: row.project_update_agenda_url ?? null,
    };

    await ensureProject(prisma, slug, createData, updateData, stats, projectCache);
  }
}

async function processObjectives(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "objective_title",
      "objective_description",
      "timeframe_start",
      "timeframe_end",
      "objective_status",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/Objectives`);

    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) {
      increment(stats.skipped, "Objective");
      continue;
    }
    const projectId = projectCache.get(slug)!;
    const status = normalizeEnum(row.objective_status, ObjectiveStatus) ?? ObjectiveStatus.ON_TRACK;
    await upsertObjective(
      prisma,
      projectId,
      {
        title: row.objective_title ?? "Untitled Objective",
        description: row.objective_description ?? undefined,
        timeframeStart: parseDate(row.timeframe_start) ?? undefined,
        timeframeEnd: parseDate(row.timeframe_end) ?? undefined,
        status,
        isCurrent: true,
      },
      stats
    );
  }
}

async function processKeyResults(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>,
  personCache: Map<string, string>,
  departmentCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "objective_title",
      "kr_code",
      "kr_title",
      "kr_description",
      "target_value",
      "unit",
      "current_value",
      "status",
      "owner_email",
      "department_code",
      "due_date",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/KeyResults`);

    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) {
      increment(stats.skipped, "KeyResult");
      continue;
    }
    const projectId = projectCache.get(slug)!;
    if (!row.objective_title) {
      stats.warnings.push(`Missing objective title for KR ${row.kr_code ?? "unknown"} in ${slug}`);
      increment(stats.skipped, "KeyResult");
      continue;
    }
    const objective = await findObjectiveByTitle(prisma, projectId, row.objective_title);
    if (!objective) {
      stats.warnings.push(`Objective not found for KR ${row.kr_code ?? "unknown"} in ${slug}`);
      increment(stats.skipped, "KeyResult");
      continue;
    }

    const status = normalizeEnum(row.status, KeyResultStatus) ?? KeyResultStatus.GREEN;
    const ownerId = row.owner_email
      ? personCache.get(row.owner_email) ?? (await prisma.person.findUnique({ where: { email: row.owner_email } }))?.id
      : null;
    const departmentId = await ensureDepartment(prisma, row.department_code, departmentCache);
    const dueDate = parseDate(row.due_date);

    const existing = await prisma.keyResult.findFirst({ where: { objectiveId: objective.id, code: row.kr_code ?? "" } });
    const updateData: Prisma.KeyResultUpdateInput = {
      title: row.kr_title ?? existing?.title ?? "Untitled KR",
      description: row.kr_description ?? undefined,
      targetValue: row.target_value ?? undefined,
      unit: row.unit ?? undefined,
      currentValue: row.current_value ?? undefined,
      status,
      dueDate: dueDate ?? undefined,
      owner: ownerId ? { connect: { id: ownerId } } : undefined,
      department: departmentId ? { connect: { id: departmentId } } : undefined,
    };

    if (existing) {
      await prisma.keyResult.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      const createData: Prisma.KeyResultCreateInput = {
        project: { connect: { id: projectId } },
        objective: { connect: { id: objective.id } },
        code: row.kr_code ?? "",
        title: row.kr_title ?? "Untitled KR",
        description: row.kr_description ?? undefined,
        targetValue: row.target_value ?? undefined,
        unit: row.unit ?? undefined,
        currentValue: row.current_value ?? undefined,
        status,
        dueDate: dueDate ?? undefined,
        owner: ownerId ? { connect: { id: ownerId } } : undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
      };
      await prisma.keyResult.create({ data: createData });
    }
    increment(stats.upserted, "KeyResult");
  }
}

async function processPushes(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "push_number",
      "push_label",
      "start_date",
      "end_date",
      "high_level_work_summary",
      "asana_project_gid",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/Pushes`);

    const slug = row.project_slug;
    const pushNumber = row.push_number ? Number(row.push_number) : NaN;
    if (!slug || Number.isNaN(pushNumber) || !projectCache.has(slug)) {
      increment(stats.skipped, "Push");
      continue;
    }
    const projectId = projectCache.get(slug)!;
    const startDate = parseDate(row.start_date);
    const endDate = parseDate(row.end_date);
    if (!startDate || !endDate) {
      stats.warnings.push(`Invalid dates for push ${pushNumber} in ${slug}`);
      increment(stats.skipped, "Push");
      continue;
    }

    await upsertPush(
      prisma,
      projectId,
      pushNumber,
      {
        name: row.push_label ?? `Push ${pushNumber}`,
        startDate,
        endDate,
        highLevelSummary: row.high_level_work_summary ?? undefined,
        asanaProjectGid: row.asana_project_gid ?? undefined,
      },
      stats
    );
  }
}

async function processMilestones(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>,
  departmentCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "milestone_order",
      "milestone_title",
      "milestone_description",
      "due_date",
      "due_quarter",
      "department_code",
      "push_number",
      "is_critical",
      "status",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/Milestones`);

    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) {
      increment(stats.skipped, "Milestone");
      continue;
    }
    const projectId = projectCache.get(slug)!;

    const title = row.milestone_title ?? "Untitled Milestone";
    const date = parseDate(row.due_date ?? row.due_quarter);
    if (!date) {
      stats.warnings.push(`Missing date for milestone ${title} in ${slug}`);
      increment(stats.skipped, "Milestone");
      continue;
    }

    const status = normalizeEnum(row.status, MilestoneStatus) ?? MilestoneStatus.PLANNED;
    const leadDepartmentId = await ensureDepartment(prisma, row.department_code, departmentCache);
    let pushId: string | undefined;
    if (row.push_number) {
      const pushNumber = Number(row.push_number);
      if (!Number.isNaN(pushNumber)) {
        const push = await prisma.push.findFirst({ where: { projectId, sequenceIndex: pushNumber } });
        pushId = push?.id;
      }
    }

    const milestoneData: Omit<Prisma.MilestoneCreateInput, "project" | "title"> = {
      description: row.milestone_description ?? undefined,
      date,
      isMajor: parseBoolean(row.is_critical) ?? false,
      status,
      leadDepartment: leadDepartmentId ? { connect: { id: leadDepartmentId } } : undefined,
      push: pushId ? { connect: { id: pushId } } : undefined,
    };

    await upsertMilestone(prisma, projectId, title, milestoneData, stats);
  }
}

async function processDecisionMakers(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "decision_maker_id",
      "name",
      "role_title",
      "organization",
      "jurisdiction",
      "priority_level",
      "stance",
      "notes",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/DecisionMakers`);

    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug) || !row.name) {
      increment(stats.skipped, "DecisionMaker");
      continue;
    }

    const projectId = projectCache.get(slug)!;
    await upsertDecisionMaker(
      prisma,
      projectId,
      row.name,
      {
        title: row.role_title ?? undefined,
        organization: row.organization ?? undefined,
        jurisdiction: row.jurisdiction ?? undefined,
        priorityLevel: row.priority_level ?? undefined,
        stance: row.stance ?? undefined,
        notes: row.notes ?? undefined,
      },
      stats
    );
  }
}

async function processBudget(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "fiscal_year",
      "category",
      "amount",
      "funding_source",
      "restricted",
      "notes",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/Budget`);

    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug) || !row.category || !row.fiscal_year) {
      increment(stats.skipped, "BudgetLine");
      continue;
    }
    const projectId = projectCache.get(slug)!;
    const period = row.fiscal_year;
    const amount = row.amount ? new Prisma.Decimal(row.amount) : new Prisma.Decimal(0);

    await upsertBudgetLine(
      prisma,
      projectId,
      row.category,
      period,
      {
        description: row.notes ?? row.category,
        amount,
        fundingSource: row.funding_source ?? undefined,
        currency: "USD",
        isActual: row.restricted ? parseBoolean(row.restricted) ?? false : false,
      },
      stats
    );
  }
}

async function processStaffAllocation(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>,
  personCache: Map<string, string>,
  departmentCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set(["person_email", "project_slug", "role_label", "allocation_percent", "department_code", "period", "hours"]);
    logUnused(row, used, stats.warnings, `${projectDir}/StaffAllocation`);

    const slug = row.project_slug;
    const email = row.person_email;
    if (!slug || !email || !projectCache.has(slug)) {
      increment(stats.skipped, "StaffAllocation");
      continue;
    }

    const projectId = projectCache.get(slug)!;
    const personId = personCache.get(email) ?? (await prisma.person.findUnique({ where: { email } }))?.id;
    if (!personId) {
      stats.warnings.push(`Person not found for staff allocation: ${email}`);
      increment(stats.skipped, "StaffAllocation");
      continue;
    }

    const period = row.period ?? row.allocation_percent ?? "unspecified";
    const hours = row.hours ? Number(row.hours) : row.allocation_percent ? Number(row.allocation_percent) : 0;
    const departmentId = await ensureDepartment(prisma, row.department_code, departmentCache);

    await upsertStaffAllocation(
      prisma,
      projectId,
      personId,
      period,
      {
        hours,
        notes: row.role_label ?? undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
      },
      stats
    );
  }
}

async function processActivities(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>,
  personCache: Map<string, string>,
  departmentCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "push_number",
      "title",
      "description",
      "owner_email",
      "department_code",
      "due_date",
      "status",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/Activities`);

    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) {
      increment(stats.skipped, "Activity");
      continue;
    }
    const projectId = projectCache.get(slug)!;
    const pushNumber = Number(row.push_number);
    if (Number.isNaN(pushNumber)) {
      stats.warnings.push(`Missing push number for activity ${row.title} in ${slug}`);
      increment(stats.skipped, "Activity");
      continue;
    }

    const push = await prisma.push.findFirst({ where: { projectId, sequenceIndex: pushNumber } });
    if (!push) {
      stats.warnings.push(`Push ${pushNumber} not found for activity ${row.title} in ${slug}`);
      increment(stats.skipped, "Activity");
      continue;
    }

    const status = (normalizeEnum(row.status, ActivityStatus) as any) ?? ActivityStatus.NOT_STARTED;
    const ownerId = row.owner_email
      ? personCache.get(row.owner_email) ?? (await prisma.person.findUnique({ where: { email: row.owner_email } }))?.id
      : null;
    const departmentId = await ensureDepartment(prisma, row.department_code, departmentCache);
    const dueDate = parseDate(row.due_date);

    await upsertActivity(
      prisma,
      projectId,
      push.id,
      row.title ?? "Untitled Activity",
      {
        description: row.description ?? undefined,
        status,
        owner: ownerId ? { connect: { id: ownerId } } : undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
        dueDate: dueDate ?? undefined,
      },
      stats
    );
  }
}

async function processCommsProfile(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>,
  personCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const used = new Set([
      "project_slug",
      "comms_lead_email",
      "backup_lead_email",
      "approval_required",
      "approver_notes",
      "local_narrative",
      "messaging_watchouts",
      "risk_and_minefields",
      "general_notes",
    ]);
    logUnused(row, used, stats.warnings, `${projectDir}/CommsProfile`);

    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) {
      increment(stats.skipped, "CommsProfile");
      continue;
    }
    const projectId = projectCache.get(slug)!;

    const commsLeadId = row.comms_lead_email ? personCache.get(row.comms_lead_email) : null;
    const backupLeadId = row.backup_lead_email ? personCache.get(row.backup_lead_email) : null;

    await upsertCommsProfile(
      prisma,
      projectId,
      {
        commsLead: commsLeadId ? { connect: { id: commsLeadId } } : undefined,
        backupLead: backupLeadId ? { connect: { id: backupLeadId } } : undefined,
        approvalRequired: parseBoolean(row.approval_required) ?? false,
        approverNotes: row.approver_notes ?? undefined,
        localNarrative: row.local_narrative ?? undefined,
        messagingWatchouts: row.messaging_watchouts ?? undefined,
        riskAndMinefields: row.risk_and_minefields ?? undefined,
        generalNotes: row.general_notes ?? undefined,
      },
      stats
    );
  }
}

async function processKeyMessages(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) continue;
    const projectId = projectCache.get(slug)!;
    const profile = await prisma.commsProfile.findUnique({ where: { projectId } });
    if (!profile) continue;

    const audience = (normalizeEnum(row.audience, AudienceType) as any) ?? AudienceType.EXTERNAL;

    await prisma.keyMessage.create({
      data: {
        project: { connect: { id: projectId } },
        commsProfile: { connect: { id: profile.id } },
        text: row.text ?? "",
        audience,
        priorityOrder: row.priority_order ? Number(row.priority_order) : 0,
      },
    });
    increment(stats.upserted, "KeyMessage");
  }
}

async function processCTAs(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) continue;
    const projectId = projectCache.get(slug)!;
    const profile = await prisma.commsProfile.findUnique({ where: { projectId } });
    if (!profile) continue;

    const status = (normalizeEnum(row.status, CallToActionStatus) as any) ?? CallToActionStatus.ACTIVE;

    await prisma.callToAction.create({
      data: {
        project: { connect: { id: projectId } },
        commsProfile: { connect: { id: profile.id } },
        description: row.description ?? "",
        url: row.url ?? undefined,
        status,
      },
    });
    increment(stats.upserted, "CallToAction");
  }
}

async function processCommsFrames(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) continue;
    const projectId = projectCache.get(slug)!;
    const profile = await prisma.commsProfile.findUnique({ where: { projectId } });
    if (!profile) continue;

    await prisma.commsFrame.create({
      data: {
        project: { connect: { id: projectId } },
        commsProfile: { connect: { id: profile.id } },
        title: row.title ?? "",
        frame: row.frame ?? "",
        whyItWorks: row.why_it_works ?? undefined,
      },
    });
    increment(stats.upserted, "CommsFrame");
  }
}

async function processFAQs(
  prisma: PrismaClient,
  projectDir: string,
  sheet: string,
  stats: ImportStats,
  projectCache: Map<string, string>
) {
  const rows = parseCsv(sheet);
  for (const row of rows) {
    const slug = row.project_slug;
    if (!slug || !projectCache.has(slug)) continue;
    const projectId = projectCache.get(slug)!;
    const profile = await prisma.commsProfile.findUnique({ where: { projectId } });
    if (!profile) continue;

    await prisma.commsFaq.create({
      data: {
        project: { connect: { id: projectId } },
        commsProfile: { connect: { id: profile.id } },
        question: row.question ?? "",
        answer: row.answer ?? "",
        priorityOrder: row.priority_order ? Number(row.priority_order) : 0,
      },
    });
    increment(stats.upserted, "CommsFaq");
  }
}

async function importProjectDir(
  prisma: PrismaClient,
  projectDir: string,
  stats: ImportStats,
  caches: {
    department: Map<string, string>;
    project: Map<string, string>;
    person: Map<string, string>;
  }
) {
  console.log(`\nImporting project directory: ${path.basename(projectDir)}`);
  const sheets = findSheetPaths(projectDir);

  const {
    people,
    projects,
    objectives,
    keyResults,
    pushes,
    milestones,
    activities,
    decisionMakers,
    budget,
    staffAllocation,
    commsProfile,
    keyMessages,
    ctas,
    commsFrames,
    faqs,
  } = sheets;

  if (people) {
    console.log(`  Processing people...`);
    await processPeople(prisma, projectDir, people, stats, caches.department, caches.person);
  } else {
    stats.warnings.push(`No people file for ${path.basename(projectDir)}`);
  }

  if (projects) {
    console.log(`  Processing projects...`);
    await processProjects(prisma, projectDir, projects, stats, caches.person, caches.project, caches.department);
  } else {
    stats.warnings.push(`No projects file for ${path.basename(projectDir)}`);
  }

  if (objectives) {
    console.log(`  Processing objectives...`);
    await processObjectives(prisma, projectDir, objectives, stats, caches.project);
  } else {
    stats.warnings.push(`No objectives file for ${path.basename(projectDir)}`);
  }

  if (keyResults) {
    console.log(`  Processing key results...`);
    await processKeyResults(prisma, projectDir, keyResults, stats, caches.project, caches.person, caches.department);
  } else {
    stats.warnings.push(`No key results file for ${path.basename(projectDir)}`);
  }

  if (pushes) {
    console.log(`  Processing pushes...`);
    await processPushes(prisma, projectDir, pushes, stats, caches.project);
  } else {
    stats.warnings.push(`No pushes file for ${path.basename(projectDir)}`);
  }

  if (activities) {
    console.log(`  Processing activities...`);
    await processActivities(prisma, projectDir, activities, stats, caches.project, caches.person, caches.department);
  }

  if (milestones) {
    console.log(`  Processing milestones...`);
    await processMilestones(prisma, projectDir, milestones, stats, caches.project, caches.department);
  } else {
    stats.warnings.push(`No milestones file for ${path.basename(projectDir)}`);
  }

  if (decisionMakers) {
    console.log(`  Processing decision makers...`);
    await processDecisionMakers(prisma, projectDir, decisionMakers, stats, caches.project);
  }

  if (budget) {
    console.log(`  Processing budget...`);
    await processBudget(prisma, projectDir, budget, stats, caches.project);
  }

  if (staffAllocation) {
    console.log(`  Processing staff allocation...`);
    await processStaffAllocation(prisma, projectDir, staffAllocation, stats, caches.project, caches.person, caches.department);
  }

  if (commsProfile) {
    console.log(`  Processing comms profile...`);
    await processCommsProfile(prisma, projectDir, commsProfile, stats, caches.project, caches.person);
  }

  if (keyMessages) {
    console.log(`  Processing key messages...`);
    await processKeyMessages(prisma, projectDir, keyMessages, stats, caches.project);
  }

  if (ctas) {
    console.log(`  Processing CTAs...`);
    await processCTAs(prisma, projectDir, ctas, stats, caches.project);
  }

  if (commsFrames) {
    console.log(`  Processing comms frames...`);
    await processCommsFrames(prisma, projectDir, commsFrames, stats, caches.project);
  }

  if (faqs) {
    console.log(`  Processing FAQs...`);
    await processFAQs(prisma, projectDir, faqs, stats, caches.project);
  }

  if (sheets.pressureSources || sheets.opponents) {
    stats.warnings.push(
      `Skipped unsupported sheets for ${path.basename(projectDir)}: ${[
        sheets.pressureSources && "pressureSources",
        sheets.opponents && "opponents",
      ]
        .filter(Boolean)
        .join(", ")}`
    );
  }
}

export async function importDashboardData({ baseDir, prisma: providedPrisma }: ImportOptions = {}) {
  const importPath = baseDir ?? path.join(process.cwd(), "data", "import");
  const projectDirs = fs
    .readdirSync(importPath)
    .map((dir) => path.join(importPath, dir))
    .filter((dir) => fs.statSync(dir).isDirectory());

  const prisma = providedPrisma ?? new PrismaClient();
  const stats = initStats();
  const caches = {
    department: new Map<string, string>(),
    project: new Map<string, string>(),
    person: new Map<string, string>(),
  };

  try {
    for (const dir of projectDirs) {
      await importProjectDir(prisma, dir, stats, caches);
    }
    return stats;
  } finally {
    if (!providedPrisma) {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  const stats = await importDashboardData();
  console.log("Import complete");
  console.table({ upserted: stats.upserted, skipped: stats.skipped });
  if (stats.warnings.length) {
    console.log("Warnings:");
    for (const warning of stats.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
