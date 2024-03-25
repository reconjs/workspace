import { AnyFunction } from "@reconjs/utils"

type Preloader = () => Promise <[ string, AnyFunction ]>

const listeners = [] as Preloader[]

let preload: undefined | (
  (loader: Preloader) => void
)

export function whenServer (onPreload: Preloader) {
  if (preload) preload (onPreload)
  else listeners.push (onPreload)
}

export function setServerPreloader (
  onPreload: (loader: Preloader) => void
) {
  const onPreloadPrev = preload

  // it seems that sometimes these things get duplicated...
  preload = (arg: Preloader) => {
    try {
      onPreloadPrev?.(arg)
    }
    catch (err) {
      console.error ("[setServerPreloader] error in prev preloader")
    }

    onPreload (arg)
  }

  for (const l of listeners) {
    preload (l)
  }
}
