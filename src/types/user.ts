export interface User {
  userID: string;
  accessToken: string;
  email: string;
}

// tslint:disable-next-line:no-any
export function userFromJSON(input: any): User {
  return {
    accessToken: input.access_token,
    userID: input.user.id,
    email: input.identity.login_id
  };
}
