export interface User {
  user_id: string;
  access_token: string;
  email: string;
}

// tslint:disable-next-line:no-any
export function userFromJSON(input: any): User {
  return {
    access_token: input.access_token,
    user_id: input.user.id,
    email: input.identity.login_id
  };
}
