export function queryify (
  base: string, 
  params: Record <string, string>
) {
  const qstr = Object.entries (params)
    .map (([ key, val ]) => `${key}=${val}`)
    .join ("&")

  const res = [ base, qstr ]
    .filter (x => !!x)
    .join ("?")

  return res
}
