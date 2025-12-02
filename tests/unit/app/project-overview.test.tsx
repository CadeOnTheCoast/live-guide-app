import { render, screen } from "@testing-library/react";
import { ObjectiveStatus, KeyResultStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";

const getUserOrRedirectMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ getUserOrRedirect: getUserOrRedirectMock }));

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const describeDb = hasDatabaseUrl ? describe : describe.skip;

const testSlug = "overview-test-project";

describeDb("Project overview page", () => {
  let projectId: string;
  let objectiveId: string;
  let keyResultIds: string[] = [];

  beforeAll(async () => {
    const existing = await db.project.findUnique({ where: { slug: testSlug }, select: { id: true } });
    if (existing) {
      await db.keyResult.deleteMany({ where: { projectId: existing.id } });
      await db.objective.deleteMany({ where: { projectId: existing.id } });
      await db.project.delete({ where: { id: existing.id } });
    }

    const project = await db.project.create({
      data: {
        name: "Overview Test Project",
        slug: testSlug,
        status: "ACTIVE"
      }
    });

    projectId = project.id;

    const objective = await db.objective.create({
      data: {
        projectId,
        title: "Launch new program",
        status: ObjectiveStatus.ON_TRACK,
        isCurrent: true
      }
    });

    objectiveId = objective.id;

    const keyResults = await Promise.all(
      ["KR1", "KR2", "KR3"].map((code, index) =>
        db.keyResult.create({
          data: {
            projectId,
            objectiveId,
            code,
            title: `Result ${index + 1}`,
            status: KeyResultStatus.GREEN
          }
        })
      )
    );

    keyResultIds = keyResults.map((kr) => kr.id);
  });

  afterAll(async () => {
    if (projectId) {
      await db.keyResult.deleteMany({ where: { projectId } });
      await db.objective.deleteMany({ where: { projectId } });
      await db.project.delete({ where: { id: projectId } });
    }
    await db.$disconnect();
  });

  it("renders the current objective and ordered key results", async () => {
    getUserOrRedirectMock.mockResolvedValue({ user: { id: "user-1" }, person: { id: "person-1", role: "VIEWER" } });

    const Page = await import("@/app/projects/[projectSlug]/overview/page");
    const element = await Page.default({ params: { projectSlug: testSlug } });

    render(element);

    expect(screen.getByText("Launch new program")).toBeInTheDocument();

    const codeCells = screen.getAllByText(/KR[1-3]/).map((node) => node.textContent);
    expect(codeCells).toEqual(["KR1", "KR2", "KR3"]);
  });

  it("cycles key result status", async () => {
    getUserOrRedirectMock.mockResolvedValue({ user: { id: "user-1" }, person: { id: "person-1", role: "ADMIN" } });

    const actions = await import("@/app/projects/[projectSlug]/overview/actions");
    const formData = new FormData();
    formData.set("keyResultId", keyResultIds[0]);
    formData.set("slug", testSlug);

    await actions.cycleKeyResultStatus({}, formData);

    const updatedKeyResult = await db.keyResult.findUnique({ where: { id: keyResultIds[0] } });
    expect(updatedKeyResult?.status).toBe(KeyResultStatus.YELLOW);
  });
});

if (!hasDatabaseUrl) {
  describe("Project overview page (no database)", () => {
    it("is skipped because DATABASE_URL is not set", () => {
      expect(true).toBe(true);
    });
  });
}
