"use server"

import { timeout } from "@reconjs/utils"
import { Product, ProductColor, Color } from "./types"

const URL = `https://images.lululemon.com/is/image/lululemon`
const QS = "fit=crop,1&op_usm=0.8,1,10,0&fmt=webp&qlt=90,1"
  + "&op_sharpen=0&resMode=sharp2&iccEmbed=0&printRes=72"

const galleryUrl = (code: string) => `${URL}/${code}?wid=320&${QS}`
const swatchUrl = (code: string) => `${URL}/${code}?wid=34&hei=34&${QS}`

// Function to generate skudatas
function generateSkus (productId: string, colorIds: string[]): string[] {
  const skudatas: string[] = []
  for (const colorId of colorIds) {
    for (let size = 0; size <= 10; size += 2) {
      skudatas.push(`${productId}_${colorId}_${size}`)
    }
  }
  return skudatas
}

const PRODUCTS = [] as Product[]
const PRODUCT_COLORS = [] as ProductColor[]
const COLORS = [] as Color[]

COLORS.push ({
  id: "velvet-dust",
  name: "Velvet Dust",
  image: swatchUrl("29847")
})

COLORS.push ({
  id: "dusty-clay",
  name: "Dusty Clay",
  image: swatchUrl("52871")
})

COLORS.push ({
  id: "solar-orange",
  name: "Solar Orange",
  image: swatchUrl("34975")
})

COLORS.push ({
  id: "delicate-mint",
  name: "Delicate Mint",
  image: swatchUrl("46741")
})

COLORS.push ({
  id: "grey-sage",
  name: "Heathered Grey Sage",
  image: swatchUrl("37338")
})

COLORS.push ({
  id: "bone",
  name: "Bone",
  image: swatchUrl("27597")
})

COLORS.push ({
  id: "carnation-red",
  name: "Carnation Red",
  image: swatchUrl("44634")
})

COLORS.push ({
  id: "pink-peony",
  name: "Pink Peony",
  image: swatchUrl("56496")
})

COLORS.push ({
  id: "dark-olive",
  name: "Dark Olive",
  image: swatchUrl("26083")
})

COLORS.push ({
  id: "red-merlot",
  name: "Red Merlot",
  image: swatchUrl("47809")
})

COLORS.push ({
  id: "true-navy",
  name: "True Navy",
  image: swatchUrl("31382")
})

PRODUCT_COLORS.push ({
  product: "a-25",
  color: "solar-orange",
  image: galleryUrl ("LW5CTCS_034975_1")
})

PRODUCT_COLORS.push ({
  product: "a-25",
  color: "delicate-mint",
  image: galleryUrl ("LW5CTCS_046741_1")
})

PRODUCT_COLORS.push ({
  product: "a-25",
  color: "grey-sage",
  image: galleryUrl ("LW5CZOS_037338_1")
})

PRODUCT_COLORS.push ({
  product: "a-25",
  color: "dusty-clay",
  image: galleryUrl ("LW5CTCS_052871_1")
})

PRODUCT_COLORS.push ({
  product: "a-28",
  color: "bone",
  image: galleryUrl ("LW5CTIS_027597_1")
})

PRODUCT_COLORS.push ({
  product: "a-28",
  color: "velvet-dust",
  image: galleryUrl ("LW5DITS_029847_1")
})

PRODUCT_COLORS.push ({
  product: "a-28",
  color: "dusty-clay",
  image: galleryUrl ("LW5CTIS_052871_1")
})

PRODUCT_COLORS.push ({
  product: "a-28",
  color: "carnation-red",
  image: galleryUrl ("LW5ECIS_044634_1")
})

PRODUCT_COLORS.push ({
  product: "a-31",
  color: "pink-peony",
  image: galleryUrl ("LW5CTLT_056496_1")
})

PRODUCT_COLORS.push ({
  product: "a-31",
  color: "dark-olive",
  image: galleryUrl ("LW5CTIS_026083_1")
})

PRODUCT_COLORS.push ({
  product: "a-31",
  color: "red-merlot",
  image: galleryUrl ("LW5CTIS_047809_1")
})

PRODUCT_COLORS.push ({
  product: "a-31",
  color: "true-navy",
  image: galleryUrl ("LW5CTIS_031382_1")
})

PRODUCTS.push ({
  id: "a-25",
  slug: "align-25",
  name: "Align™ Pant 25\"",
  price: "$98 - $118",
  length: '25"',
  skus: generateSkus ("align-25", [
    "solar-orange",
    "delicate-mint",
    "grey-sage",
    "dusty-clay",
  ]),
})

PRODUCTS.push ({
  id: "a-28",
  slug: "align-28",
  name: "Align™ Pant 28\"",
  price: "$98 - $118",
  length: '28"',
  skus: generateSkus ("align-28", [
    "bone",
    "velvet-dust",
    "dusty-clay",
    "carnation-red",
    // "emboss-black",
  ]),
})

PRODUCTS.push ({
  id: "a-31",
  slug: "align-31",
  name: "Align™ Pant 31\"",
  price: "$98 - $118",
  length: '31"',
  skus: generateSkus ("align-31", [
    "pink-peony",
    "dark-olive",
    "red-merlot",
    "true-navy",
  ]),
})

export async function loadColors (id: string) {
  const res = PRODUCT_COLORS
    .filter (({ product }) => product === id)
    .map (({ color }) => COLORS.find(x => x.id === color)!)
  return res
}

export async function loadImage (id: string, color: string) {
  if (!id) throw new Error ("No product ID")
  
  const [ data ] = PRODUCT_COLORS.filter (x => {
    if (x.product !== id) return false
    if (!color) return true
    return x.color === color
  })
  
  return data.image
}

export async function loadProduct (id: string) {
  if (!id) throw new Error ("No product ID")
  
  const data = PRODUCTS.find (x => x.id === id)
  if (!data) throw new Error ("No data for Product ID")
    
  return data
}

export async function loadProductBySlug (slug: string) {
  if (!slug) throw new Error ("No product ID")
  
  const data = PRODUCTS.find (x => x.slug === slug)
  if (!data) throw new Error ("No product data for slug")
    
  return data
}

export async function loadRecommendations () {
  return ["a-25", "a-28", "a-31"]
}