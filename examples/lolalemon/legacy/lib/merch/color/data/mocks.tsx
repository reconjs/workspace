const BASE_URL = `https://images.lululemon.com/is/image/lululemon`
const QS = "fit=crop,1&op_usm=0.8,1,10,0&fmt=webp&qlt=90,1&op_sharpen=0&resMode=sharp2&iccEmbed=0&printRes=72"
const swatchUrl = (code: string) => `${BASE_URL}/${code}?wid=34&hei=34&${QS}`

const COLORS = {} as Record <string, {
  name: string,
  image: string,
}>

COLORS["dusty-clay"] = {
  "name": "Dusty Clay",
  "image": swatchUrl("52871")
}

COLORS["solar-orange"] = {
  "name": "Solar Orange",
  "image": swatchUrl("34975")
}

COLORS["delicate-mint"] = {
  "name": "Delicate Mint",
  "image": swatchUrl("46741")
}

COLORS["grey-sage"] = {
  "name": "Heathered Grey Sage",
  "image": swatchUrl("37338")
}

COLORS["bone"] = {
  "name": "Bone",
  "image": swatchUrl("27597")
}

COLORS["velvet-dust"] = {
  "name": "Velvet Dust",
  "image": swatchUrl("29847")
}

COLORS["carnation-red"] = {
  "name": "Carnation Red",
  "image": swatchUrl("44634")
}

COLORS["pink-peony"] = {
  "name": "Pink Peony",
  "image": swatchUrl("56496")
}

COLORS["dark-olive"] = {
  "name": "Dark Olive",
  "image": swatchUrl("26083")
}

COLORS["red-merlot"] = {
  "name": "Red Merlot",
  "image": swatchUrl("47809")
}

COLORS["true-navy"] = {
  "name": "True Navy",
  "image": swatchUrl("31382")
}

export default COLORS
