import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    project: {
      findMany: findManyMock
    }
  }
}));

describe("Home page", () => {
  it("renders projects from loader", async () => {
    const Page = await import("@/app/page");
    const sampleProjects = [
      {
        id: "proj-1",
        name: "Sample Project",
        slug: "sample-project",
        status: "ACTIVE",
        primaryOwner: {
          id: "person-1",
          name: "Alex Rivera",
          email: "alex.rivera@example.com",
          isActive: true,
          defaultDepartmentId: "dept-1",
          defaultDepartment: {
            id: "dept-1",
            name: "Project Management",
            code: "PM",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        startDate: new Date("2024-01-01"),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    findManyMock.mockResolvedValue(sampleProjects);

    const element = await Page.default();
    render(element);

    expect(findManyMock).toHaveBeenCalled();
    expect(screen.getByText("Sample Project")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("Project Management")).toBeInTheDocument();
  });
});
