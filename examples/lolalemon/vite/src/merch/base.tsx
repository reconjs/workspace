import recon, { Model$, Scope$, get$ } from "@reconjs/core"

const $ = recon ("@/merch/base")

export const PRODUCT$ = $(class Product extends String {})
export const SLUG$ = $(class ProductSlug extends String {})
export const SKU$ = $(class Sku extends Number {})

export const COLOR$ = $(class Color extends String {})
export const PURCHATT$ = $(class Purchatt extends String {})
export const PURCHOPT$ = $(class Purchopt extends String {})

const getSku$ = $(() => {
  return Model$ (SKU$, () => {
    return null as any
  })
})

export const viaSku$ = $(() => {
  const $sku = getSku$()
  return Scope$ ($sku)
})

// PRODUCT

const getProduct$ = $(() => {
  return Model$ (PRODUCT$, () => {
    return null as any
  })
})

export const viaProduct$ = $(() => {
  const $product = getProduct$()
  return Scope$ ($product)
})

// COLOR

const getColor$ = $(() => {
  return Model$ (COLOR$, () => {
    return null as any
  })
})

export const viaColor$ = $(() => {
  const $color = getColor$()
  return Scope$ ($color)
})

/*
// PURCHATT

const getPurchatt$ = $(() => {
  return Model$ (PURCHATT$, () => {
    return null as any
  })
})

export const viaPurchatt$ = $(() => {
  const $purchatt = getPurchatt$()
  return Scope$ ($purchatt)
})

// PURCHOPT

type Func = (...args: any[]) => any

const ifColor$: Func = () => {}
const ifNot$: Func = () => {}
const isNil$: Func = () => {}
const not$: Func = () => {}
const when$: Func = () => {}

const getPurchattOption$: Func = () => {}

const getPurchopt$ = $(() => {
  // should this be an arg?
  const _purchatt = viaPurchatt$()
  const $purchatt = get$ (_purchatt)

  const $isColor = ifColor$ ($purchatt)
  const $notColor = ifNot$ ($isColor)

  const $color = when$ ($isColor, () => {
    const _color = viaColor$()
    return get$ (_color)
  })

  const $purchopt = when$ ($notColor, () => {
    return getPurchattOption$ ($purchatt)
  })

  return Model$ (PURCHOPT$, () => {
    if ($isColor()) return $color()
    return $purchopt()
  })
})

export const viaPurchopt$ = $(PURCHATT$) (() => {
  const $color = getPurchopt$()
  return Scope$ ($color)
})

const getPurchopt$ = $(() => {
  const _purchatt = viaPurchatt$()
  const $purchatt = get$ (_purchatt)

  const $isColor = ifColor$ ($purchatt)

  const $color = when$ ($isColor, () => {
    const _color = viaColor$()
    return get$ (_color)
  })

  const $purchopt = when$ (not$ ($isColor), () => {
    const _purchopt = viaPurchopt$ ($purchatt)
    return get$ (_purchopt)
  })

  return Model$ (PURCHOPT$, () => {
    if ($isColor()) return $color()
    return $purchopt()
  })
})
*/
