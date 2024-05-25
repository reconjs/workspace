import {
  Adapted,
  Adapter,
  Atom,
  InferClassModel,
  ModelClass,
  registerModel,
} from "@reconjs/recon"

function usingModel <C extends ModelClass> (
  model: C
): Adapter <InferClassModel <C>> {
  type M = InferClassModel <C>

  function adaptAtom (arg: any): Atom <M> {
    if (!arg || typeof arg !== "object") {
      // console.log ("[adaptAtom]", arg)
      throw new Error ("[adaptAtom] expected object")
    }

    switch (arg.__RECON__) {
      case "modeled":
        const atom: Partial <Atom> = () => arg.value
        atom.__RECON__ = "atom"
        atom.model = arg.model
        // @ts-ignore
        if (arg.variable) {
          // @ts-ignore
          atom.variable = () => arg.variable()
        }
        return atom as any
      default: throw new Error ("[adaptAtom] invalid arg")
    }
  }

  // @ts-ignore
  return (arg: unknown) => {
    if (!arg) throw new Error ("[usingModel] expected argument")
    if (typeof arg !== "function") return adaptAtom (arg)

    const res: Partial <Adapted <M>> = () => arg ()
    res.__RECON__ = "adapted"
    res.model = model as unknown as ModelClass <M>
    return res as any
  }
}

export function defineModel <C extends ModelClass> (model: C) {
  type M = InferClassModel <C>

  const res: Partial <Adapter> = (arg: M) => {
    const asa = usingModel (model)
    return asa (arg)
  }

  res.__RECON__ = "adapter"

  // @ts-ignore
  res.viaRecon = (key: string) => {
    registerModel (key, model)
  }

  return res as Adapter <M>
}
