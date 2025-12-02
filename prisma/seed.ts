import { db } from "../src/server/db";

const departments = [
  { code: "PM", name: "Project Management" },
  { code: "GA", name: "Government Affairs" },
  { code: "CE", name: "Conservation & Ecology" },
  { code: "COMMS", name: "Communications" },
  { code: "FR", name: "Fundraising & Resources" }
];

const people = [
  {
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    departmentCode: "PM"
  },
  {
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    departmentCode: "GA"
  },
  {
    name: "Taylor Morgan",
    email: "taylor.morgan@example.com",
    departmentCode: "CE"
  },
  {
    name: "Sam Carter",
    email: "sam.carter@example.com",
    departmentCode: "COMMS"
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
    name: "Watershed Restoration",
    slug: "watershed-restoration",
    status: "ACTIVE",
    startDate: new Date("2024-01-15"),
    ownerEmail: "alex.rivera@example.com"
  },
  {
    name: "Community Outreach",
    slug: "community-outreach",
    status: "PLANNING",
    startDate: new Date("2024-03-01"),
    ownerEmail: "jordan.lee@example.com"
  },
  {
    name: "Habitat Monitoring",
    slug: "habitat-monitoring",
    status: "ACTIVE",
    startDate: new Date("2024-02-10"),
    ownerEmail: "taylor.morgan@example.com"
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
          defaultDepartmentId: department?.id
        },
        create: {
          name: person.name,
          email: person.email,
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
    console.log(`Seeded ${result.departments} departments, ${result.people} people, ${result.projects} projects.`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

if (require.main === module) {
  run();
}
