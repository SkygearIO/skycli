export async function handleFailureResponse(response: Response) {
  return response.json().then((payload) => {
    throw payload;
  }).catch((error) => {
    throw new Error(response.statusText);
  });
}
