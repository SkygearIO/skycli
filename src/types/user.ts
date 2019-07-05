export interface User {
  userID: string;
  accessToken: string;
  // TODO(identity): Get email from current identity
}

// tslint:disable-next-line:no-any
export function userFromJSON(input: any): User {
  return {
    accessToken: input.access_token,
    userID: input.user_id
  };
}
