export class ReconGlobalRef {}

export class ReconModel <T> {}



export class ReconLocalRef {}



export class ReconSignal extends ReconLocalRef {
  constructor () {
    super ()
  }
}



export class ReconInstruction {
  private self: {
    definition: ReconDefinition,
    parameters: ReconSignal[],
  }

  constructor (self: {
    definition: ReconDefinition,
    parameters: ReconSignal[],
  }) {
    this.self = { ...self }
  }

  get definition () {
    return this.self.definition
  }

  get parameters () {
    return this.self.parameters
  }
}



export class ReconDefinition {
  private self: {
    instructions: ReconInstruction[],
  }

  constructor (self: {
    instructions: ReconInstruction[],
  }) {
    this.self = { ...self }

    this.invoke = this.invoke.bind (this)
  }

  // Accessors

  get connections () {
    return this.self.connections
  }

  // Methods

  invoke (...args: any[]) {
    throw new Error ("ReconDefinition::invoke must be overloaded")
  }
}
