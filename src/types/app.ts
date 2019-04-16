export interface App {
  id: string;
  name: string;
}

// tslint:disable-next-line:no-any
export function appFromJSON(input: any): App {
  return {
    id: input.id,
    name: input.name
  };
}
