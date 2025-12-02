import { db } from "../src/server/db";

const departments = ["PM", "GA", "CE", "Comms", "F&R"];

const people = [
  {
    firstName: "Alex",
    lastName: "Rivera",
    email: "alex.rivera@example.com",
    department: "PM"
  },
  {
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@example.com",
    department: "GA"
  },
  {
    firstName: "Taylor",
    lastName: "Morgan",
    email: "taylor.morgan@example.com",
    department: "CE"
  }
];

const projects = [
  {
    name: "Watershed Restoration",
    status: "In Progress",
    startDate: new Date("2024-01-15"),
    department: "PM",
    ownerEmail: "alex.rivera@example.com"
  },
  {
    name: "Community Outreach",
    status: "Planned",
    startDate: new Date("2024-03-01"),
    department: "Comms",
    ownerEmail: "jordan.lee@example.com"
  },
  {
    name: "Habitat Monitoring",
    status: "Active",
    startDate: new Date("2024-02-10"),
    department: "CE",
    ownerEmail: "taylor.morgan@example.com"
  }
];

export async function seed() {
  const departmentRecords = await Promise.all(
    departments.map((name) =>
      db.department.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  const peopleRecords = await Promise.all(
    people.map((person) =>
      db.person.upsert({
        where: { email: person.email },
        update: {},
        create: {
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          department: {
            connect: { name: person.department }
          }
        }
      })
    )
  );

  for (const project of projects) {
    await db.project.upsert({
      where: { name: project.name },
      update: {},
      create: {
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        department: {
          connect: { name: project.department }
        },
        owner: {
          connect: { email: project.ownerEmail }
        }
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
