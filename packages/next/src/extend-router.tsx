type RouterExtension = (params: Record <string, string>) => () => void

let locked = false

const extensions = [] as RouterExtension[]

export function useExtensions (params: Record <string, string>) {
  locked = true
  
  const hooks = extensions.map ((useExtend) => useExtend (params))

  return function usingExtensions () {
    let count = 0

    for (const hook of hooks) {
      console.log ("[usingExtensions] hook", count++)
      hook()
    }
  }
}

export function extendRouter (extend: RouterExtension) {
  if (locked === true) {
    throw new Error ("Extensions has been locked")
  }

  extensions.push (extend)
}
