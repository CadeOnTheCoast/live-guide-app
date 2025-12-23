export type DepartmentFormState = {
  errors: {
    name?: string;
    code?: string;
  };
  formError?: string;
};

export const departmentInitialState: DepartmentFormState = { errors: {} };

export type DeleteDepartmentState = {
  formError?: string;
};

export const deleteDepartmentInitialState: DeleteDepartmentState = {};
