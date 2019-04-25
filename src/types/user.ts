export interface User {
  userID: string;
  accessToken: string;
  loginID: LoginID;
}
export interface LoginID {
  email: string;
}

// tslint:disable-next-line:no-any
export function userFromJSON(input: any): User {
  return {
    accessToken: input.access_token,
    loginID: loginIDFromJSON(input.login_ids),
    userID: input.user_id
  };
}

// tslint:disable-next-line:no-any
export function loginIDFromJSON(input: any): LoginID {
  return {
    email: input.email || ''
  };
}
