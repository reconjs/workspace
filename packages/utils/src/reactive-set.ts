import { Store, createStore } from "./sources"

export type ReactiveSet <T> = Store <Set <T>> & {
  add: (item: T) => void,
  delete: (item: T) => void,
}

export function createReactiveSet <T> (): ReactiveSet <T> {
  const store = createStore (() => {
    return new Set <T> ()
  }) as any

  return {
    ...store,
    add: (item) => {
      store.read().add (item)
      store.refresh()
    },
    delete: (item) => {
      store.read().delete (item)
      store.refresh()
    }
  }
}
