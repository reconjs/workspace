export function withResolvers <T> () {
  const resolvers: {
    promise: Promise <T>,
    resolve: (value: T) => void,
    reject: (error: any) => void,
  } = {} as any
  
  resolvers.promise = new Promise <T> ((resolve, reject) => {
    resolvers.resolve = resolve
    resolvers.reject = reject
  })
  
  return resolvers
}