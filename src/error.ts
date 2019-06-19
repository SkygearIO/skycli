import chalk from 'chalk';

export function printError(error: any) {
  let s = '';

  // skyerr
  if (error && error.json && error.json.error) {
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
  return error && error.response && error.response.status === 404;
}
