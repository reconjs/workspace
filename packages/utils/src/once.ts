const NEVER = {} as any

export function once <T> (func: () => T) {
  let res: T = NEVER
  return () => {
    if (res === NEVER) {
      res = func ()
    }
    return res
  }
}
