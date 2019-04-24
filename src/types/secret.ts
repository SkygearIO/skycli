export interface Secret {
  id: string;
  name: string;
  createdAt: Date;
}

// tslint:disable-next-line:no-any
export function secretFromJSON(input: any): Secret {
  return {
    createdAt: input.created_at && new Date(input.created_at),
    id: input.id,
    name: input.name
  };
}
