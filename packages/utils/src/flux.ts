import { createEvent } from "./sources"

async function godo <T> (func: () => Promise <void>) {
  try {
    await func ()
  }
  catch (err) {
    console.error (err)
  }
}

function createQueue <T> () {
  let running = false

  const queue = [] as Array <ReturnType <typeof createEvent>>

  async function next () {
    // console.group ("next")
    try {
      const event = queue.shift ()
      running = !!event
      event?.push?.()
    }
    catch (err) {
      console.error (err)
    }
    // console.groupEnd ()
  }

  async function turn () {
    const event = createEvent ()

    const promise = new Promise <void> ((resolve) => {
      event.subscribe (() => {
        resolve ()
      })
    })

    queue.push (event)
    if (queue.length === 1 && ! running) next ()
    await promise
  }

  return async function enqueue <T> (func: () => Promise <T>) {
    // console.group ("[enqueue]")
    try {
      await turn ()
      // console.log ("my turn")
      try {
        return await func ()
      }
      finally {
        next ()
      }
    }
    finally {
      // console.groupEnd ()
    }
  }
}

export function flux <S, A extends any[]> (
  initial: () => Promise <S>,
  reducer: (s: S, ...args: A) => Promise <S>,
) {
  let state: S
  let error: Error

  const enqueue = createQueue ()

  enqueue (async () => {
    // console.group ("[flux] init start")
    try {
      state = await initial ()
    }
    catch (err: any) {
      error = err
    }
    finally {
      // console.groupEnd ()
    }
  })

  async function read (): Promise <S> {
    // console.group ("[flux] read")
    try {
      if (error) throw error
      return await enqueue (async () => {
        if (error) throw error
        return state
      })
    } 
    finally {
      // console.groupEnd ()
    }
  }

  async function dispatch (...args: A) {
    if (error) throw error
    await enqueue (async () => {
      if (error) throw error

      try {
        state = await reducer (state, ...args)
      }
      catch (err: any) {
        error = err
      }

      if (error) throw error
    })
  }

  return [ read, dispatch ] as const
}
