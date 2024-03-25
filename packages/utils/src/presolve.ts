import { susync } from "./async-retry"
import { asLoadable, loadPromise, resolved } from "./loadable"

import { Fanc0, Func } from "./types"

let ready = true
let curr = resolved (undefined as any)
let count = 0

export function presolve <T extends Func> (load: Fanc0 <T>) {
  const prev = curr
  const self = ++count
  // console.log ("[presolve]", self)

  async function loadAll () {
    try {
      await prev
    }
    catch (e) {
      if (e instanceof Promise) {
        throw new Error (`[presolve] caught promise in prev (${self})`)
      }
    }

    const { promise } = await susync (() => {
      // console.log ("[presolve] trying", self)

      const res = {
        promise: asLoadable (load())
      }

      res.promise.debugLabel = `[presolve] inner`
      return res
    })

    // console.log ("[presolve] ready", self)

    try {
      const res = await promise
      // console.log ("[presolve] resolved", self)
      return res
    }
    catch (e) {
      if (e instanceof Promise) {
        throw new Error (`[presolve] caught promise in load (${self})`)
      }
      throw e
    }
  }

  const promise = asLoadable (new Promise <any> ((resolve, reject) => {
    loadAll().then (resolve).catch (reject)
    setTimeout (() => {
      reject (new Error ("[presolve] timeout"))
    }, 10000)
  }))

  promise.debugLabel = `[presolve]`

  curr = promise
  
  const res: Func = (...args) => {
    // console.log ("[presolve] loading", self)

    if (!ready) {
      throw new Error ("[presolve] not ready")
    }

    if (!promise.status) {
      // console.log ("--> ERROR")
      throw new Error ("[presolve] promise not loadable")
    }
    if (promise.status === "pending") {
      // console.log ("--> PENDING")
      // throw new Error ("[presolve] promise pending")
    }

    const get = loadPromise (promise)
    // console.log ("[presolve] loaded", self)
    return get (...args)
  }
  
  return res as T
}

let flushCount = 0

// @ts-ignore
susync.onStart = () => {
  ready = true
}

// @ts-ignore
susync.onComplete = () => {
  // ready = false
}

export async function preflush () {
  const self = ++flushCount

  // console.log ("[preflush] start", self)
  await susync (() => {
    loadPromise (curr)
    // loadPromise (curr)
  })
  // console.log ("[preflush] finish", self)
}
