export interface User {
    userID: string;
    accessToken: string;
    metadata: Metadata;
}
export interface Metadata {
    email: string;
}

// tslint:disable-next-line:no-any
export function userFromJSON(input: any): User {
    return {
        accessToken: input.access_token,
        metadata: metaFromJSON(input.metadata),
        userID: input.user_id
    };
}

// tslint:disable-next-line:no-any
export function metaFromJSON(input: any): Metadata {
    return {
        email: input.email
    };
}
