type AnyFunction = (...args: any[]) => any

export function withStatics <T extends Record <string, any>> (obj: T) {
  return <F extends AnyFunction>(func: F) => Object.assign (func, obj)
}

export function loggable <T extends AnyFunction> (func: T) {
  let abled = true
  let label = "(unlabeled)"

  const statics = {
    setAbled: (nextAbled: boolean) => {
      abled = nextAbled
    },
    setLabel: (nextLabel: string) => {
      label = nextLabel
    },
    log: (...args: any[]) => {
      if (abled) {
        console.log (...args)
      }
    },
  }

  const wrapped: AnyFunction = (...args) => {
    console.group (`[loggable] ${label}`)
    console.log (...args)
    try {
      const res = func (...args)
      console.log ("returns", res)
      return res
    }
    catch (thrown) {
      if (thrown instanceof Promise) {
        console.log ("throws promise")
      }
      else {
        console.error (thrown)
      }
      throw thrown
    }
    finally {
      console.groupEnd ()
    }
  }

  return withStatics (statics)(wrapped as T)
}
