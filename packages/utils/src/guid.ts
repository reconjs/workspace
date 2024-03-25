let count = 0

const guidCache = new Map <any, string> ()

export function guidBy (...args: any[]) {
  const atoms = args.map ((arg) => {
    const found = guidCache.get (arg)
    if (found) return found

    const res = `${count++}`
    guidCache.set (arg, res)
    return res
  })

  return `guid:${atoms.join ("-")}`
}

export type AnyFunction = (...args: any[]) => any

const memoCache = new Map <string, any> ()

export function memoize <T extends AnyFunction> (func: T): T {
  const memoized: AnyFunction = (...args) => {
    const guid = guidBy (func, ...args)

    const found = memoCache.get (guid) as T
    if (found) return found

    const res = func (...args)
    memoCache.set (guid, res)
    return res
  }

  return memoized as T
}
