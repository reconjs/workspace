const URL = `https://images.lululemon.com/is/image/lululemon`
const QS = "fit=crop,1&op_usm=0.8,1,10,0&fmt=webp&qlt=90,1&op_sharpen=0&resMode=sharp2&iccEmbed=0&printRes=72"
const galleryUrl = (code: string) => `${URL}/${code}?wid=320&${QS}`

type Product = {
  id: string,
  slug: string,
  name: string,
  price: string,
  length: string,
  colors: Record <string, string>,
  skudatas: string[]
}

export const PRODUCTS = [] as Product[]

// Function to generate skudatas
function generateSkudatas (productId: string, colorIds: string[]): string[] {
  const skudatas: string[] = []
  for (const colorId of colorIds) {
    for (let size = 0; size <= 10; size += 2) {
      skudatas.push(`${productId}_${colorId}_${size}`)
    }
  }
  return skudatas
}

PRODUCTS.push ({
  id: "a-25",
  slug: "align-25",
  name: "Align™ Pant 25\"",
  price: "$98 - $118",
  length: '25"',
  colors: {
    "solar-orange": galleryUrl("LW5CTCS_034975_1"),
    "delicate-mint": galleryUrl ("LW5CTCS_046741_1"),
    "grey-sage": galleryUrl ("LW5CZOS_037338_1"),
    "dusty-clay": galleryUrl ("LW5CTCS_052871_1"),
  },
  skudatas: generateSkudatas ("align-25", [
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
  colors: {
    "bone": galleryUrl ("LW5CTIS_027597_1"),
    "velvet-dust": galleryUrl ("LW5DITS_029847_1"),
    "dusty-clay": galleryUrl ("LW5CTIS_052871_1"),
    "carnation-red": galleryUrl ("LW5ECIS_044634_1"),
    // "emboss-black": galleryUrl ("LW5DVHS_060846_1"),
  },
  skudatas: generateSkudatas ("align-28", [
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
  colors: {
    "pink-peony": galleryUrl ("LW5CTLT_056496_1"),
    "dark-olive": galleryUrl ("LW5CTJT_026083_1"),
    "red-merlot": galleryUrl ("LW5CTJT_047809_1"),
    "true-navy": galleryUrl ("LW5DQPT_031382_1"),
  },
  skudatas: generateSkudatas ("align-31", [
    "pink-peony",
    "dark-olive",
    "red-merlot",
    "true-navy",
  ]),
})

export default PRODUCTS
