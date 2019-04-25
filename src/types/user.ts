export interface User {
  userID: string;
  accessToken: string;
  loginIDs: LoginIDs;
}
export interface LoginIDs {
  email: string;
}

// tslint:disable-next-line:no-any
export function userFromJSON(input: any): User {
  return {
    accessToken: input.access_token,
    loginIDs: loginIDsFromJSON(input.login_ids),
    userID: input.user_id
  };
}

// tslint:disable-next-line:no-any
export function loginIDsFromJSON(input: any): LoginIDs {
  return {
    email: input.email
  };
}
