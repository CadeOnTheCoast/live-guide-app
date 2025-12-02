import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { seed } from "../../prisma/seed";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const describeDb = hasDatabaseUrl ? describe : describe.skip;

describeDb("database seeding", () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates base departments", async () => {
    const departments = await db.department.findMany({ select: { code: true } });
    const departmentCodes = departments.map((department: { code: string }) => department.code);
    ["PM", "GA", "CE", "COMMS", "FR"].forEach((code) => {
      expect(departmentCodes).toContain(code);
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
