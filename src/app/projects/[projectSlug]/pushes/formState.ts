export type PushFormState = {
  errors: {
    startDate?: string;
    endDate?: string;
    sequenceIndex?: string;
  };
  formError?: string;
  success?: boolean;
};

export const pushInitialState: PushFormState = { errors: {}, success: false };

export type ActivityFormState = {
  errors: {
    title?: string;
    status?: string;
  };
  formError?: string;
  success?: boolean;
};

export const activityInitialState: ActivityFormState = { errors: {}, success: false };
