const STATUSES = [ 
  "pending", 
  "resolved", 
  "rejected",
] as const

export type Loadable <T> = Promise<T> & {
  status?: typeof STATUSES[number],
  result?: T,
  thrown?: Error|Promise <any>,
  debugLabel?: string,
}

export function isLoadable (promise: Promise <any>) {
  return STATUSES.includes ((promise as any).status ?? "")
}

export function resolved <T> (value: T) {
  const resolved = Promise.resolve (value) as Loadable <T>
  resolved.status = "resolved"
  resolved.result = value
  return resolved
}

export function rejected <T> (reason: Error) {
  const rejected = Promise.reject (reason) as Loadable <T>
  rejected.status = "rejected"
  rejected.thrown = reason
  return rejected
}

export function asLoadable <T> (promise: T|Promise <T>): Loadable <T> {
  if (! promise) {
    console.error ("[asLoadable] Promise is not defined")
    throw new Error ("[asLoadable] Promise is not defined")
  }
  if (! (promise instanceof Promise)) {
    return resolved (promise)
  }

  const loadable = promise as Loadable <T>
  if (typeof loadable.status === "string") return loadable
  
  loadable.status = "pending"
  loadable.then(
    (v) => {
      loadable.status = "resolved"
      loadable.result = v
    },
    (e) => {
      loadable.status = "rejected"
      if (e instanceof Promise) {
        loadable.thrown = new Error ("[asLoadable] Recursive Suspense")
      }
      
      loadable.thrown = e
    }
  )
  return loadable
}

export function loadPromise <T> (promise: Promise <T>): T {
  const loadable = asLoadable (promise)
  if (loadable.status === 'resolved') return loadable.result as T
  if (loadable.status === 'rejected') {
    if (loadable.thrown instanceof Promise) {
      const caught = loadable.thrown as Loadable <T>

      let message = "[loadPromise] Recursive Suspense"
      if (loadable.debugLabel) message += ` (caught by "${loadable.debugLabel}")`
      if (caught.debugLabel) message += ` (thrown by "${caught.debugLabel}")`
      
      throw new Error (message)
    }
    throw loadable.thrown
  }
  console.assert (loadable.status === "pending")
  throw loadable
}
