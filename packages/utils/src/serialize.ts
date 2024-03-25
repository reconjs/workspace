function serializeAux (unordered: any) {
  if (!unordered) return unordered ?? null // no undefined

  // If it's an array - recursively order any
  // dictionary items within the array
  if (Array.isArray (unordered)) {
    const ordered = [] as any[]
    unordered.forEach (function (item, index) {
      ordered [index] = serializeAux (item)
    })
    return ordered
  }

  // If it's an object - let's order the keys
  if (typeof unordered === 'object') {
    const ordered = {} as Record <string, any>
    Object.keys (unordered).sort().forEach ((key) => {
      ordered [key] = serializeAux (unordered [key])
    })
    return ordered
  }

  return unordered
}

export function serialize (data: any) {
  const sortedData = serializeAux (data)
  return JSON.stringify (sortedData, null, 2)
}
