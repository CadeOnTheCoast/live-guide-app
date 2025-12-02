"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { getPersonActiveInitialState, setPersonActive, type PersonActiveState } from "@/app/admin/people/actions";

export default function PersonActiveToggle({ personId, isActive }: { personId: string; isActive: boolean }) {
  const [state, formAction] = useFormState<PersonActiveState, FormData>(
    setPersonActive,
    getPersonActiveInitialState()
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="id" value={personId} />
      <input type="hidden" name="isActive" value={(!isActive).toString()} />
      <Button variant="ghost" size="sm" type="submit">
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {state.formError && <p className="text-xs text-destructive">{state.formError}</p>}
    </form>
  );
}
