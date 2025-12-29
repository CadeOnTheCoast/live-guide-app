import { describe, expect, it } from "vitest";

describe("Home page", () => {
  it("redirects to /projects", async () => {
    const Page = await import("@/app/page");

    try {
      Page.default();
    } catch (error: any) {
      expect(error?.digest).toContain("/projects");
      return;
    }

    throw new Error("Expected redirect to /projects");
  });
});
