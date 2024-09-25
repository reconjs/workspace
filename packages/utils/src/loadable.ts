const STATUSES = [ 
  "pending", 
  "fulfilled", 
  "rejected",
] as const

export type Loadable <T> = Promise<T> & {
  status?: typeof STATUSES[number],
  value?: T,
  reason?: Error|Promise <any>,
  debugLabel?: string,
}

export function isLoadable (promise: Promise <any>) {
  return STATUSES.includes ((promise as any).status ?? "")
}

export function resolved <T> (value: T) {
  const resolved = Promise.resolve (value) as Loadable <T>
  resolved.status = "fulfilled"
  resolved.value = value
  return resolved
}

export function rejected <T> (reason: Error) {
  const rejected = Promise.reject (reason) as Loadable <T>
  rejected.status = "rejected"
  rejected.reason = reason
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
      loadable.status = "fulfilled"
      loadable.value = v
    },
    (e) => {
      loadable.status = "rejected"
      if (e instanceof Promise) {
        loadable.reason = new Error ("[asLoadable] Recursive Suspense")
      }
      
      loadable.reason = e
    }
  )
  return loadable
}

export function loadPromise <T> (promise: Promise <T>): T {
  const loadable = asLoadable (promise)
  if (loadable.status === "fulfilled") return loadable.value as T
  if (loadable.status === "rejected") {
    if (loadable.reason instanceof Promise) {
      const caught = loadable.reason as Loadable <T>

      let message = "[loadPromise] Recursive Suspense"
      if (loadable.debugLabel) message += ` (caught by "${loadable.debugLabel}")`
      if (caught.debugLabel) message += ` (reason by "${caught.debugLabel}")`
      
      throw new Error (message)
    }
    throw loadable.reason
  }
  console.assert (loadable.status === "pending")
  throw loadable
}
