import {
  Adapter,
  Atom, 
  InferModel,
  ModelClass,
  Modelable,
  InferAdapter,
  usingBroadlyAux,
  Adapted,
} from "@reconjs/recon"

export interface Collection <M extends Modelable = Modelable> extends Modelable {
  model: ModelClass <M>
  value: Array <M["value"]>
}

export interface Optional <M extends Modelable> extends Modelable {
  model: ModelClass <M>
  value: M["value"]|null
}

export function usingCollection <
  A extends Adapter,
> (adapter: A): Adapter <Collection <InferAdapter <A>>> {
  // @ts-ignore
  return (arg) => {
    // @ts-ignore
    const adapted = adapter (arg)
    // @ts-ignore
    adapted.collection = true
    // @ts-ignore
    adapted.variable ??= adapter.variable
    return adapted
  }
}

export function usingOptional <
  A extends Adapter,
> (adapter: A): Adapter <Optional <InferAdapter <A>>> {
  // @ts-ignore
  return (arg: any) => {
    // @ts-ignore
    console.log ("[usingOptional] arg", arg)

    // @ts-ignore
    const adapted = adapter.asOptional
      // @ts-ignore
      ? adapter.asOptional (arg)
      : adapter (arg)

    // @ts-ignore
    adapted.optional = true
    // @ts-ignore
    adapted.variable ??= adapter.variable

    return adapted as Adapted
  }
}



// BROADLY

export function usingBroadly <A extends Atom <Collection>> (atom: A) {
  type M = InferModel <A>
  const adapter: any = usingBroadlyAux (atom)
  return adapter as Adapter <M>
}
