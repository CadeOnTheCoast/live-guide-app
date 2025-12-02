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
        id: 1,
        name: "Sample Project",
        status: "Active",
        department: { id: 1, name: "PM", createdAt: new Date(), updatedAt: new Date() },
        owner: {
          id: 1,
          firstName: "Alex",
          lastName: "Rivera",
          email: "alex.rivera@example.com",
          departmentId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        startDate: new Date("2024-01-01"),
        departmentId: 1,
        ownerId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    findManyMock.mockResolvedValue(sampleProjects);

    const element = await Page.default();
    render(element);

    expect(findManyMock).toHaveBeenCalled();
    expect(screen.getByText("Sample Project")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
  });
});
