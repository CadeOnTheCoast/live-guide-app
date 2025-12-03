import { render, screen, within, fireEvent } from "@testing-library/react";
import { ActivityStatus, KeyResultStatus, ObjectiveStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { formatPushName } from "@/server/pushes";

const getUserOrRedirectMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ getUserOrRedirect: getUserOrRedirectMock }));

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const describeDb = hasDatabaseUrl ? describe : describe.skip;

const testSlug = "pushes-test-project";

describeDb("Project pushes page", () => {
  let projectId: string;
  let pushId: string;
  let activityIds: string[] = [];
  let departmentAId: string;
  let departmentBId: string;

  beforeAll(async () => {
    const existing = await db.project.findUnique({ where: { slug: testSlug }, select: { id: true } });
    if (existing) {
      await db.activity.deleteMany({ where: { projectId: existing.id } });
      await db.push.deleteMany({ where: { projectId: existing.id } });
      await db.keyResult.deleteMany({ where: { projectId: existing.id } });
      await db.objective.deleteMany({ where: { projectId: existing.id } });
      await db.milestone.deleteMany({ where: { projectId: existing.id } });
      await db.project.delete({ where: { id: existing.id } });
    }

    const [departmentA, departmentB] = await Promise.all([
      db.department.create({ data: { name: "Eng Push", code: "ENG-PUSH" } }),
      db.department.create({ data: { name: "Ops Push", code: "OPS-PUSH" } })
    ]);

    departmentAId = departmentA.id;
    departmentBId = departmentB.id;

    const [personA, personB] = await Promise.all([
      db.person.create({ data: { name: "Push Owner A", email: "push-owner-a@example.com", role: "ADMIN" } }),
      db.person.create({ data: { name: "Push Owner B", email: "push-owner-b@example.com", role: "EDITOR" } })
    ]);

    const project = await db.project.create({
      data: {
        name: "Pushes Test Project",
        slug: testSlug,
        status: "ACTIVE",
        primaryOwnerId: personA.id
      }
    });

    projectId = project.id;

    const objective = await db.objective.create({
      data: {
        projectId,
        title: "Grow impact",
        status: ObjectiveStatus.ON_TRACK,
        isCurrent: true
      }
    });

    const kr = await db.keyResult.create({
      data: {
        projectId,
        objectiveId: objective.id,
        code: "KR1",
        title: "Ship v1",
        status: KeyResultStatus.GREEN
      }
    });

    const push = await db.push.create({
      data: {
        projectId,
        sequenceIndex: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        highLevelSummary: "Test push summary",
        name: formatPushName({ sequenceIndex: 1, startDate: new Date(), endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }),
        objectiveId: objective.id
      }
    });

    pushId = push.id;

    const activities = await Promise.all([
      db.activity.create({
        data: {
          projectId,
          pushId,
          title: "Plan work",
          status: ActivityStatus.NOT_STARTED,
          departmentId: departmentA.id,
          ownerId: personA.id,
          relatedKrId: kr.id
        }
      }),
      db.activity.create({
        data: {
          projectId,
          pushId,
          title: "Execute",
          status: ActivityStatus.IN_PROGRESS,
          departmentId: departmentA.id,
          ownerId: personB.id
        }
      }),
      db.activity.create({
        data: {
          projectId,
          pushId,
          title: "Resolve blockers",
          status: ActivityStatus.BLOCKED,
          departmentId: departmentB.id
        }
      }),
      db.activity.create({
        data: {
          projectId,
          pushId,
          title: "Launch",
          status: ActivityStatus.COMPLETED,
          departmentId: departmentB.id,
          ownerId: personA.id
        }
      })
    ]);

    activityIds = activities.map((activity) => activity.id);
  });

  afterAll(async () => {
    if (projectId) {
      await db.activity.deleteMany({ where: { projectId } });
      await db.push.deleteMany({ where: { projectId } });
      await db.keyResult.deleteMany({ where: { projectId } });
      await db.objective.deleteMany({ where: { projectId } });
      await db.milestone.deleteMany({ where: { projectId } });
      await db.project.delete({ where: { id: projectId } });
    }
    await db.department.deleteMany({ where: { code: { in: ["ENG-PUSH", "OPS-PUSH"] } } });
    await db.person.deleteMany({ where: { email: { in: ["push-owner-a@example.com", "push-owner-b@example.com"] } } });
    await db.$disconnect();
  });

  it("renders pushes and groups activities by status", async () => {
    getUserOrRedirectMock.mockResolvedValue({ user: { id: "user-1" }, person: { id: "person-1", role: "ADMIN" } });

    const Page = await import("@/app/projects/[projectSlug]/pushes/page");
    const element = await Page.default({ params: { projectSlug: testSlug } });

    render(element);

    expect(screen.getByText(/Push 1 -/)).toBeInTheDocument();

    const inProgressLabel = screen.getByText("IN PROGRESS", { selector: "p" });
    const inProgressColumn = inProgressLabel.closest("div")?.parentElement as HTMLElement;
    expect(within(inProgressColumn).getByText("Execute")).toBeInTheDocument();
  });

  it("filters activities by department and status", async () => {
    getUserOrRedirectMock.mockResolvedValue({ user: { id: "user-1" }, person: { id: "person-1", role: "ADMIN" } });

    const Page = await import("@/app/projects/[projectSlug]/pushes/page");
    const element = await Page.default({ params: { projectSlug: testSlug } });

    render(element);

    const selects = screen.getAllByRole("combobox");
    const departmentSelect = selects[0];
    const statusSelect = selects[1];

    fireEvent.change(departmentSelect, { target: { value: departmentAId } });
    fireEvent.change(statusSelect, { target: { value: ActivityStatus.IN_PROGRESS } });

    expect(screen.getByText("Execute")).toBeInTheDocument();
    expect(screen.queryByText("Resolve blockers")).not.toBeInTheDocument();
  });

  it("updates status via the action", async () => {
    getUserOrRedirectMock.mockResolvedValue({ user: { id: "user-1" }, person: { id: "person-1", role: "ADMIN" } });

    const actions = await import("@/app/projects/[projectSlug]/pushes/actions");
    const formData = new FormData();
    formData.set("activityId", activityIds[0]);
    formData.set("slug", testSlug);
    formData.set("status", ActivityStatus.IN_PROGRESS);

    await actions.updateActivityStatus(formData);

    const updated = await db.activity.findUnique({ where: { id: activityIds[0] } });
    expect(updated?.status).toBe(ActivityStatus.IN_PROGRESS);
  });
});

if (!hasDatabaseUrl) {
  describe("Project pushes page (no database)", () => {
    it("is skipped because DATABASE_URL is not set", () => {
      expect(true).toBe(true);
    });
  });
}
