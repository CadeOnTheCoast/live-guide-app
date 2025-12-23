import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KeyResultRowForm } from "@/components/projects/KeyResultRowForm";
import { Table, TableBody } from "@/components/ui/table";
import type { CycleStatusState, KeyResultFormState } from "@/app/projects/[projectSlug]/overview/formState";

describe("KeyResultRowForm", () => {
  it("renders the hidden form inside a table cell", () => {
    const upsertAction = vi.fn(async (state: KeyResultFormState) => state);
    const cycleAction = vi.fn(async (state: CycleStatusState) => state);

    const { container } = render(
      <Table>
        <TableBody>
          <KeyResultRowForm
            projectId="project-1"
            objectiveId="objective-1"
            slug="test-project"
            upsertAction={upsertAction}
            cycleStatusAction={cycleAction}
            people={[]}
            departments={[]}
            isNew
            canEdit
          />
        </TableBody>
      </Table>
    );

    const form = container.querySelector("tbody form");
    expect(form).toBeTruthy();
    expect(form?.parentElement?.tagName).toBe("TD");
    expect(form?.closest("tbody")?.firstElementChild?.tagName).toBe("TR");
  });
});
