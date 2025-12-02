import { describe, expect, it, beforeAll, afterAll } from "vitest";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const describeDb = hasDatabaseUrl ? describe : describe.skip;

describeDb("database seeding", () => {
  let db: Awaited<ReturnType<typeof import("@/server/db")>>["db"];
  let seed: (typeof import("../../prisma/seed"))["seed"];

  beforeAll(async () => {
    ({ db } = await import("@/server/db"));
    ({ seed } = await import("../../prisma/seed"));
    await seed();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates base departments", async () => {
    const departments = await db.department.findMany({ select: { name: true } });
    const departmentNames = departments.map((department) => department.name);
    ["PM", "GA", "CE", "Comms", "F&R"].forEach((name) => {
      expect(departmentNames).toContain(name);
    });
  });

  it("creates at least one project", async () => {
    const count = await db.project.count();
    expect(count).toBeGreaterThan(0);
  });
});

if (!hasDatabaseUrl) {
  describe("database seeding", () => {
    it("is skipped because DATABASE_URL is not set", () => {
      expect(true).toBe(true);
    });
  });
}
