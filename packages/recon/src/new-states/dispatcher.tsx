import React from "react"
import { Func } from "@reconjs/utils"
import { onPerform, perform, Pointer, Subject } from "../machine"
import { TaskSymbol } from "./task"

class HookPointer extends Pointer <any> {
  constructor (
    public readonly key: string|symbol,
    public readonly args: any[],
  ) {
    super()
  }
}

const REDISPATCHER = new Proxy ({}, {
  get: (target, key) => {
    return (...args: any[]) => {
      return perform (function* () {
        return yield* new HookPointer (key, args)
      })
    }
  }
})

function getInternals () {
  // @ts-ignore
  return React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
}

function getDispatcher () {
  const internals = getInternals()
  return internals?.H
}

function setDispatcher (next: any) {
  const internals = getInternals()
  internals.H = next
}

export function useDispatcher (key: string): Func|undefined {
  const dispatcher = getDispatcher()
  if (!dispatcher) throw new Error ("hooks must be called in a component")
  return dispatcher[key]
}

const STACK = [] as TaskSymbol[]
let prevDispatcher: any = null

export class PushSubject extends Subject {
  constructor (public readonly task: TaskSymbol) {
    super()
  }
}

export class PopSubject extends Subject {
  constructor (public readonly task: TaskSymbol) {
    super()
  }
}

onPerform (PushSubject, function* ({ task }) {
  STACK.push (task)
  if (STACK.length === 1) {
    prevDispatcher = getDispatcher()
    getInternals().H = REDISPATCHER
  }
})

onPerform (PopSubject, function* () {
  STACK.pop()
  if (STACK.length === 0) {
    setDispatcher (prevDispatcher)
    prevDispatcher = null
  }
})