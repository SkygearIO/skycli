import { CLIContext, User, userFromJSON } from '../types';
import { callAPI } from './skygear';

export async function signupWithEmail(
  context: CLIContext,
  email: string,
  password: string
): Promise<User> {
  return callAPI(context, '/_auth/signup', 'POST', {
    login_ids: [{ key: 'email', value: email }],
    password
  }).then((payload) => {
    return userFromJSON(payload.result);
  });
}

export async function loginWithEmail(
  context: CLIContext,
  email: string,
  password: string
): Promise<User> {
  return callAPI(context, '/_auth/login', 'POST', {
    login_id: email,
    password
  }).then((payload) => {
    return userFromJSON(payload.result);
  });
}

export async function logout(context: CLIContext): Promise<void> {
  return callAPI(context, '/_auth/logout', 'POST');
}
