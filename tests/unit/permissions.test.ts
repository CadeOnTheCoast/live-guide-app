import { describe, expect, it } from "vitest";
import { canEditProject, canManageAdminArea, isViewer } from "@/server/permissions";

describe("permissions", () => {
  it("checks admin access", () => {
    expect(canManageAdminArea("ADMIN")).toBe(true);
    expect(canManageAdminArea("EDITOR")).toBe(false);
  });

  it("checks edit access", () => {
    expect(canEditProject("ADMIN")).toBe(true);
    expect(canEditProject("EDITOR")).toBe(true);
    expect(canEditProject("VIEWER")).toBe(false);
  });

  it("checks viewer", () => {
    expect(isViewer("VIEWER")).toBe(true);
    expect(isViewer("ADMIN")).toBe(false);
  });
});
