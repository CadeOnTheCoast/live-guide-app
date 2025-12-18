import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { importDashboardData } from "../../scripts/import-dashboard-data";

class MockPrisma {
  private idCounter = 1;
  personData = new Map<string, any>();
  departmentData = new Map<string, any>();
  projectData = new Map<string, any>();
  objectiveData = new Map<string, any>();
  keyResultData = new Map<string, any>();
  pushData = new Map<string, any>();
  milestoneData = new Map<string, any>();
  decisionMakerData = new Map<string, any>();
  budgetLineData = new Map<string, any>();
  staffAllocationData = new Map<string, any>();

  private nextId(prefix: string) {
    return `${prefix}-${this.idCounter++}`;
  }

  private findFirstBy(map: Map<string, any>, predicate: (value: any) => boolean) {
    for (const value of map.values()) {
      if (predicate(value)) return value;
    }
    return null;
  }

  person = {
    upsert: async ({ where, update, create }: any) => {
      const existing = this.personData.get(where.email);
      if (existing) {
        const updated = { ...existing, ...update };
        this.personData.set(where.email, updated);
        return updated;
      }
      const created = { id: this.nextId("person"), ...create };
      this.personData.set(where.email, created);
      return created;
    },
    findUnique: async ({ where }: any) => this.personData.get(where.email) ?? null,
  };

  department = {
    upsert: async ({ where, update, create }: any) => {
      const existing = this.departmentData.get(where.code);
      if (existing) {
        const updated = { ...existing, ...update };
        this.departmentData.set(where.code, updated);
        return updated;
      }
      const created = { id: this.nextId("dept"), ...create };
      this.departmentData.set(where.code, created);
      return created;
    },
  };

  project = {
    upsert: async ({ where, update, create }: any) => {
      const existing = this.projectData.get(where.slug);
      if (existing) {
        const updated = { ...existing, ...update };
        this.projectData.set(where.slug, updated);
        return updated;
      }
      const created = { id: this.nextId("project"), ...create };
      this.projectData.set(where.slug, created);
      return created;
    },
    findUnique: async ({ where }: any) => this.projectData.get(where.slug) ?? null,
  };

  objective = {
    findFirst: async ({ where }: any) =>
      this.findFirstBy(this.objectiveData, (value) => value.projectId === where.projectId && value.title === where.title),
    update: async ({ where, data }: any) => {
      const existing = this.objectiveData.get(where.id);
      const updated = { ...existing, ...data };
      this.objectiveData.set(where.id, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      const projectId = data.project?.connect?.id ?? data.projectId;
      const record = { id: this.nextId("objective"), ...data, projectId };
      delete (record as any).project;
      this.objectiveData.set(record.id, record);
      return record;
    },
  };

  keyResult = {
    findFirst: async ({ where }: any) =>
      this.findFirstBy(
        this.keyResultData,
        (value) => value.objectiveId === where.objectiveId && value.code === where.code
      ),
    update: async ({ where, data }: any) => {
      const existing = this.keyResultData.get(where.id);
      const updated = { ...existing, ...data };
      this.keyResultData.set(where.id, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      const record = {
        id: this.nextId("kr"),
        ...data,
        projectId: data.project.connect.id,
        objectiveId: data.objective.connect.id,
      };
      delete (record as any).project;
      delete (record as any).objective;
      this.keyResultData.set(record.id, record);
      return record;
    },
  };

  push = {
    findFirst: async ({ where }: any) =>
      this.findFirstBy(this.pushData, (value) => value.projectId === where.projectId && value.sequenceIndex === where.sequenceIndex),
    update: async ({ where, data }: any) => {
      const existing = this.pushData.get(where.id);
      const updated = { ...existing, ...data };
      this.pushData.set(where.id, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      const record = { id: this.nextId("push"), ...data, projectId: data.project.connect.id };
      delete (record as any).project;
      this.pushData.set(record.id, record);
      return record;
    },
  };

  milestone = {
    findFirst: async ({ where }: any) =>
      this.findFirstBy(this.milestoneData, (value) => value.projectId === where.projectId && value.title === where.title),
    update: async ({ where, data }: any) => {
      const existing = this.milestoneData.get(where.id);
      const updated = { ...existing, ...data };
      this.milestoneData.set(where.id, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      const record = { id: this.nextId("milestone"), ...data, projectId: data.project.connect.id };
      delete (record as any).project;
      this.milestoneData.set(record.id, record);
      return record;
    },
  };

  decisionMaker = {
    findFirst: async ({ where }: any) =>
      this.findFirstBy(this.decisionMakerData, (value) => value.projectId === where.projectId && value.name === where.name),
    update: async ({ where, data }: any) => {
      const existing = this.decisionMakerData.get(where.id);
      const updated = { ...existing, ...data };
      this.decisionMakerData.set(where.id, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      const record = { id: this.nextId("dm"), ...data, projectId: data.project.connect.id };
      delete (record as any).project;
      this.decisionMakerData.set(record.id, record);
      return record;
    },
  };

  budgetLine = {
    findFirst: async ({ where }: any) =>
      this.findFirstBy(
        this.budgetLineData,
        (value) => value.projectId === where.projectId && value.category === where.category && value.period === where.period
      ),
    update: async ({ where, data }: any) => {
      const existing = this.budgetLineData.get(where.id);
      const updated = { ...existing, ...data };
      this.budgetLineData.set(where.id, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      const record = { id: this.nextId("budget"), ...data, projectId: data.project.connect.id };
      delete (record as any).project;
      this.budgetLineData.set(record.id, record);
      return record;
    },
  };

  staffAllocation = {
    findFirst: async ({ where }: any) =>
      this.findFirstBy(
        this.staffAllocationData,
        (value) => value.projectId === where.projectId && value.personId === where.personId && value.period === where.period
      ),
    update: async ({ where, data }: any) => {
      const existing = this.staffAllocationData.get(where.id);
      const updated = { ...existing, ...data };
      this.staffAllocationData.set(where.id, updated);
      return updated;
    },
    create: async ({ data }: any) => {
      const record = {
        id: this.nextId("staff"),
        ...data,
        projectId: data.project.connect.id,
        personId: data.person.connect.id,
      };
      delete (record as any).project;
      delete (record as any).person;
      this.staffAllocationData.set(record.id, record);
      return record;
    },
  };

  async $disconnect() {
    return Promise.resolve();
  }
}

function createFixtureCsv(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "People.csv"),
    ["name,email,department_code,role", "Demo Owner,owner@example.com,ENG,ADMIN"].join("\n")
  );
  fs.writeFileSync(
    path.join(dir, "Projects.csv"),
    [
      "project_slug,project_name,status,start_date,primary_owner_email,short_description,case_for_change_summary,case_for_change_link,default_department_code",
      "demo-slug,Demo Project,ACTIVE,2024-01-01,owner@example.com,Short description,Summary,,ENG",
    ].join("\n")
  );
  fs.writeFileSync(
    path.join(dir, "Objectives.csv"),
    [
      "project_slug,objective_title,objective_description,timeframe_start,timeframe_end,objective_status",
      "demo-slug,Obj Title,Obj description,2024-01-01,2024-06-30,ON_TRACK",
    ].join("\n")
  );
  fs.writeFileSync(
    path.join(dir, "KeyResults.csv"),
    [
      "project_slug,objective_title,kr_code,kr_title,kr_description,target_value,unit,current_value,status,owner_email,department_code,due_date",
      "demo-slug,Obj Title,KR1,KR Title,KR Desc,10,units,5,GREEN,owner@example.com,ENG,2024-06-01",
    ].join("\n")
  );
}

describe("importDashboardData", () => {
  it("imports CSV data and can be rerun idempotently", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-import-"));
    const importDir = path.join(tmpDir, "data", "import", "demo");
    createFixtureCsv(importDir);

    const prisma = new MockPrisma();
    const baseDir = path.join(tmpDir, "data", "import");

    const first = await importDashboardData({ baseDir, prisma: prisma as any });
    expect(prisma.projectData.size).toBe(1);
    expect(prisma.personData.size).toBe(1);
    expect(prisma.objectiveData.size).toBe(1);
    expect(prisma.keyResultData.size).toBe(1);
    expect(first.upserted.Project).toBeGreaterThan(0);

    const second = await importDashboardData({ baseDir, prisma: prisma as any });
    expect(prisma.projectData.size).toBe(1);
    expect(prisma.keyResultData.size).toBe(1);
    expect(second.upserted.Project).toBeGreaterThan(0);
  });
});
