export function multiplyArray<T>(arr: T[], n: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(...arr);
  }
  return result;
}
