// tests/setupTests.ts
import { vi } from "vitest";

// Patch react-dom to provide useFormState in the test environment
vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  const React = await vi.importActual<typeof import("react")>("react");
  const { useState, useCallback } = React;

  function fallbackUseFormState<S, P extends FormData = FormData>(
    action: (prevState: S, formData: P) => Promise<S> | S,
    initialState: S
  ): [S, (formData: P) => void] {
    const [state, setState] = useState<S>(initialState);

    const formAction = useCallback(
      async (formData: P) => {
        const next = await action(state, formData);
        setState(next);
      },
      [action, state]
    );

    return [state, formAction];
  }

  return {
    ...actual,
    // Use real useFormState if present, otherwise our fallback
    useFormState: (actual as any).useFormState ?? fallbackUseFormState,
  };
});