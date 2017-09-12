import Raven from 'raven-js';

export function handleFailureResponse(response) {
  return response.json().then((error) => {
    throw new Error(error);
  }).catch((err) => {
    Raven.captureException(err, {
      statusCode: response.status
    });
    throw err;
  });
}

export function handleSkygearError(error) {
  if (error instanceof Error || error.status >= 500) {
    console.error(error);
  } else {
    console.warn(error);
  }

  return Promise.reject(error);
}
