//Check if x is in values. If true, then TypeScript knows that x is of type T
//https://stackoverflow.com/a/74213179
export function isIn<T>(values: readonly T[], x: any): x is T {
  return values.includes(x)
}