import chalk from 'chalk';
import { Response } from 'node-fetch';

export class HTTPError extends Error {
  response: Response;
  json: any;

  constructor(message: string, response: Response) {
    super(message);
    this.response = response;
  }
}

// This function never rejects
export async function makeHTTPError(response: Response): Promise<HTTPError> {
  // By default, we use statusText as error message
  // This is a fallback only.
  const preparedError = new HTTPError(response.statusText, response);

  try {
    const json = await response.json();
    preparedError.json = json;
    // Use skyerr message if available
    if (json && json.error && json.error.message) {
      preparedError.message = json.error.message;
    }
  } catch {}

  return preparedError;
}

export function printError(error: any) {
  let s = '';

  // skyerr
  if (error instanceof HTTPError && error.json && error.json.error) {
    const skyerr = error.json.error;
    switch (skyerr.code) {
      // invalid argument
      case 108:
        s = [skyerr.message, ...(skyerr.info.arguments || [])].join('\n');
        break;
      default:
        s = skyerr.message;
        break;
    }
  } else if (error instanceof Error) {
    s = error.message;
  } else if (typeof error === 'object') {
    try {
      s = JSON.stringify(error);
    } catch {
      s = `${error}`;
    }
  } else {
    s = `${error}`;
  }

  console.log(chalk.red(s));
}

export function isHTTP404(error: any): boolean {
  return error instanceof HTTPError && error.response.status === 404;
}
