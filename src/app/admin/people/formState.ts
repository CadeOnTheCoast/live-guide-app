export type PersonFormState = {
  errors: {
    name?: string;
    email?: string;
    role?: string;
  };
  formError?: string;
};

export const personInitialState: PersonFormState = { errors: {} };

export type PersonActiveState = { formError?: string };

export const personActiveInitialState: PersonActiveState = {};
