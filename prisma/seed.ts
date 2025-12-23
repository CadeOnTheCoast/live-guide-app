import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const departments = [
  { code: "PM", name: "Project Management" },
  { code: "GA", name: "Government Affairs" },
  { code: "CE", name: "Community Engagement" },
  { code: "COMMS", name: "Communications" },
  { code: "FR", name: "Field and Research" }
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
  const departmentRecords = await Promise.all(
    departments.map(({ code, name }) =>
      db.department.upsert({
        where: { code },
        update: { name },
        create: { code, name }
      })
    )
  );

  const departmentByCode = Object.fromEntries(departmentRecords.map((dept) => [dept.code, dept]));

  const peopleRecords = await Promise.all(
    people.map((person) => {
      const department = departmentByCode[person.departmentCode];

      return db.person.upsert({
        where: { email: person.email },
        update: {
          name: person.name,
          defaultDepartmentId: department?.id,
          role: person.role
        },
        create: {
          name: person.name,
          email: person.email,
          role: person.role,
          defaultDepartment: department ? { connect: { id: department.id } } : undefined
        }
      });
    })
  );

  const peopleByEmail = Object.fromEntries(peopleRecords.map((personRecord) => [personRecord.email, personRecord]));

  for (const project of projects) {
    const primaryOwner = peopleByEmail[project.ownerEmail];

    await db.project.upsert({
      where: { slug: project.slug },
      update: {
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        primaryOwner: primaryOwner ? { connect: { id: primaryOwner.id } } : undefined
      },
      create: {
        name: project.name,
        slug: project.slug,
        status: project.status,
        startDate: project.startDate,
        primaryOwner: primaryOwner ? { connect: { id: primaryOwner.id } } : undefined
      }
    });
  }

  return { departments: departmentRecords.length, people: peopleRecords.length, projects: projects.length };
}

async function run() {
  try {
    const result = await seed();
    console.log(
      `Seeded ${result.departments} departments, ${result.people} people, ${result.projects} projects.`
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

run();
