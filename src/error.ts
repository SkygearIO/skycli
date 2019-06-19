export function isHTTP404(error: any): boolean {
  return error && error.response && error.response.status === 404;
}
