import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const departments = [
  { code: "PM", name: "Project Management", sortOrder: 10 },
  { code: "GA", name: "Government Affairs", sortOrder: 20 },
  { code: "CE", name: "Community Engagement", sortOrder: 30 },
  { code: "FR", name: "Field and Research", sortOrder: 40 },
  { code: "DEV", name: "Development", sortOrder: 50 }
];

const people = [
  {
    name: "Cade Kistler",
    email: "ckistler@mobilebaykeeper.org",
    departmentCode: "PM",
    role: "ADMIN" as const
  }
];

type ProjectSeed = {
  name: string;
  slug: string;
  status: "PLANNING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate?: Date;
  ownerEmail: string;
};

const projects: ProjectSeed[] = [
  {
    name: "Toxics Criteria",
    slug: "toxics-criteria",
    status: "ACTIVE",
    startDate: new Date("2024-01-01"),
    ownerEmail: "ckistler@mobilebaykeeper.org"
  },
  {
    name: "Oyster Farm",
    slug: "oyster-farm",
    status: "ACTIVE",
    startDate: new Date("2024-01-01"),
    ownerEmail: "ckistler@mobilebaykeeper.org"
  },
  {
    name: "Oyster Hatchery Project",
    slug: "oyster-hatchery-project",
    status: "ACTIVE",
    startDate: new Date("2024-01-01"),
    ownerEmail: "ckistler@mobilebaykeeper.org"
  }
];

export async function seed() {
  console.log("Starting seed...");

  // 1. Departments
  const departmentRecords = await Promise.all(
    departments.map(({ code, name, sortOrder }) =>
      db.department.upsert({
        where: { code },
        update: { name, sortOrder, isActive: true },
        create: { code, name, sortOrder, isActive: true }
      })
    )
  );
  console.log(`Upserted ${departmentRecords.length} canonical departments.`);

  const departmentByCode = Object.fromEntries(departmentRecords.map((dept) => [dept.code, dept]));

  // 2. People
  const peopleRecords = await Promise.all(
    people.map((person) => {
      const department = departmentByCode[person.departmentCode];

      return db.person.upsert({
        where: { email: person.email },
        update: {
          name: person.name,
          defaultDepartmentId: department?.id,
          role: person.role,
          isActive: true
        },
        create: {
          name: person.name,
          email: person.email,
          role: person.role,
          isActive: true,
          defaultDepartment: department ? { connect: { id: department.id } } : undefined
        }
      });
    })
  );
  console.log(`Upserted ${peopleRecords.length} core people.`);

  const peopleByEmail = Object.fromEntries(peopleRecords.map((personRecord) => [personRecord.email, personRecord]));

  // 3. Projects
  for (const project of projects) {
    const primaryOwner = peopleByEmail[project.ownerEmail];

    await db.project.upsert({
      where: { slug: project.slug },
      update: {
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        primaryOwner: primaryOwner ? { connect: { id: primaryOwner.id } } : undefined,
        isActive: true
      },
      create: {
        name: project.name,
        slug: project.slug,
        status: project.status,
        startDate: project.startDate,
        primaryOwner: primaryOwner ? { connect: { id: primaryOwner.id } } : undefined,
        isActive: true
      }
    });
  }
  console.log(`Upserted ${projects.length} required projects.`);

  return { departments: departmentRecords.length, people: peopleRecords.length, projects: projects.length };
}

async function run() {
  try {
    const result = await seed();
    console.log("Seed finished successfully.");
  } catch (e) {
    console.error("Seed failed:", e);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

run();
