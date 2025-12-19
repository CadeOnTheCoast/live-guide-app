export type MilestoneFormState = {
  errors: {
    title?: string;
    date?: string;
  };
  formError?: string;
  success?: boolean;
};

export const milestoneInitialState: MilestoneFormState = { errors: {}, success: false };
