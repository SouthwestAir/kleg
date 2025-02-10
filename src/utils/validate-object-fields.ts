// Returns an array with any missing fields
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateObjectFields(obj: any, keys: string[]): string[] {
  const missingFields: string[] = [];
  for (const key of keys) {
    if (!(key in obj) || obj[key] === undefined) {
      missingFields.push(key);
    }
  }
  return missingFields;
}
