import { 
  Adapter,
  Atom,
  InferAdapter,
  InferAtomizableType,
  fromAdaptableSync,
} from "@reconjs/recon"
import { RSC } from "@reconjs/utils-react"
import { useMemo } from "react"

function useMemoish <T> (factory: () => T, deps: any[]): T {
  if (RSC) return factory ()
  return useMemo (factory, deps)
}

// TODO: Make reactive to changes
export function useRecon <
  A extends Adapter,
> (asa: A, value: InferAtomizableType <InferAdapter <A>>) {
  const res: any = useMemoish (() => {
    const adapted = asa (() => value)
    const atom = fromAdaptableSync (adapted)

    atom.model ??= asa.model ?? adapted.model

    // @ts-ignore
    atom.optional ??= asa.optional ?? adapted.optional
    // @ts-ignore
    atom.collection ??= asa.collection ?? adapted.collection
    
    return atom
  }, [ value ])

  return res as Atom <InferAdapter <A>>
}
