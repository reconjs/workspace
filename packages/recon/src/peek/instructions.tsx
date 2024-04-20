import { AnyFunction, cloneDeep, memoize } from "@reconjs/utils"

import { createRoot, defineHook, handleHook } from "../hooks"

export type InstructionArg = {
  kind: "atom",
  argument?: number,
  instruction?: number,
}

export type Instruction = {
  factory: AnyFunction,
  args: InstructionArg[],
  returns?: "atom",
  meta: any,
}

const MAP = new Map <AnyFunction, Instruction[]> ()



// Define instruction hook

const NEVER_INSTRUCTIONS = [] as Instruction[]

const usingInstructions = defineHook (() => {
  return NEVER_INSTRUCTIONS
})

/**
 * @returns whether or not we are calculating instructions.
 */
export function usingModeIsInstruction () {
  const instructions = usingInstructions ()
  return instructions !== NEVER_INSTRUCTIONS
}

/**
 * used by definers to add an instruction.
 * 
 * @param instruction The instruction to add to the list.
 */
export function usingInstruction (instruction: Instruction) {
  const instructions = usingInstructions ()

  if (instructions !== NEVER_INSTRUCTIONS) {
    instructions.push (instruction)
  }
}



// Calculate the instructions:

function instructionsOf (factory: AnyFunction) {
  const found = MAP.get (factory)
  if (found) return found

  const root = createRoot ()

  try {
    const instructions = [] as Instruction[]

    root.exec (() => {
      handleHook (usingInstructions, () => instructions)
      factory ()
    })

    MAP.set (factory, instructions)
    return instructions
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      throw new Error ("Instructions cannot be calculated asynchronously.")
    }
    throw thrown
  }
}

/**
 * @param factory The factory to get the instructions of.
 */
export const getInstructions = memoize ((factory: AnyFunction) => {
  const instructions = instructionsOf (factory)
  return cloneDeep (instructions)
})
