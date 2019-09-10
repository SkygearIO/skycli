import chalk from 'chalk';
import { SkygearErrorName, SkygearError } from '@skygear/node-client';

export function printError(error: any) {
  let s = '';

  if (error instanceof SkygearError) {
    // skygear error from sdk
    switch (error.name as SkygearErrorName) {
      case 'InvalidArgument':
        if (error.info && error.info['arguments']) {
          s = [error.message, ...(error.info['arguments'] as string[])].join(
            '\n'
          );
        }
        break;
      case 'PermissionDenied':
        // maybe webhook error, try getting reason from info
        if (error.info && error.info['errors']) {
          s = (error.info['errors'] as { reason: string }[])
            .map(({ reason }) => reason)
            .join('\n');
        }
        break;
      default:
        break;
    }
    // fallback to message if errors is empty
    s = s || error.message;
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
  return (
    error instanceof SkygearError &&
    (error.name as SkygearErrorName) === 'ResourceNotFound'
  );
}
