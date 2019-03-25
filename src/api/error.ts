export async function handleFailureResponse(response: Response) {
  const payload = await response.json().then((p) => {
    return p;
  }).catch((error) => {
    throw new Error(response.statusText);
  });

  const message = payload.error && payload.error.message;
  throw new Error(message || `Fail to parse error: ${JSON.stringify(payload)}`);
}
