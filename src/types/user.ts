export interface User {
    userID: string;
    accessToken: string;
    meta: Meta;
}
export interface Meta {
    email: string;
}

// tslint:disable-next-line:no-any
export function userFromJSON(input: any): User {
    return {
        accessToken: input.access_token,
        // FIXME: update profile to meta after auth gear update
        meta: metaFromJSON(input.profile),
        userID: input.user_id
    };
}

// tslint:disable-next-line:no-any
export function metaFromJSON(input: any): Meta {
    return {
        email: input.email
    };
}
