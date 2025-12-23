import type { KeyResultStatus } from "@prisma/client";

export type ObjectiveFormState = {
  errors: {
    title?: string;
    timeframe?: string;
    status?: string;
  };
  formError?: string;
  success?: boolean;
};

export const objectiveFormInitialState: ObjectiveFormState = {
  errors: {}
};

export type KeyResultFormState = {
  errors: {
    code?: string;
    title?: string;
    objective?: string;
    dueDate?: string;
  };
  formError?: string;
  success?: boolean;
};

export const keyResultFormInitialState: KeyResultFormState = {
  errors: {}
};

export type CycleStatusState = { formError?: string; nextStatus?: KeyResultStatus };

export const cycleStatusInitialState: CycleStatusState = {};
