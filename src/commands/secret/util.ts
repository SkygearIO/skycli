export function validateSecretName(secretName: string): boolean {
  return !!secretName && !!secretName.match(/^[A-Z0-9][_A-Z0-9]+[A-Z0-9]$/);
}
