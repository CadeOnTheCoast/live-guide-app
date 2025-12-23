export type ProjectFormState = {
  errors: {
    name?: string;
    slug?: string;
    date?: string;
  };
  formError?: string;
};

export const PROJECT_STATUS_OPTIONS = ["PLANNING", "ACTIVE", "PAUSED", "COMPLETED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUS_OPTIONS)[number];

export const projectInitialState: ProjectFormState = { errors: {} };
