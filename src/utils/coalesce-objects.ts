export function coalesceObjects<T extends object>(
  primaryObj: T,
  secondaryObj: T
): T {
  const entries = Object.entries(secondaryObj) as [keyof T, T[keyof T]][];
  const coalescedObj = { ...primaryObj };

  for (const [key, value] of entries) {
    if (coalescedObj[key] === undefined) {
      coalescedObj[key] = value;
    }
  }

  return coalescedObj;
}
