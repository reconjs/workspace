export type Func <T = any, A extends any[] = any[]> = (...args: A) => T
export type Fanc <T = any, A extends any[] = any[]> = (...args: A) => Promise <T>

export type Vunc <A extends any[] = any[]> = (...args: A) => void
export type Vanc <A extends any[] = any[]> = (...args: A) => Promise <void>

export type Func0 <T = any> = () => T
export type Fanc0 <T = any> = () => Promise <T>

export type Func1 <T = any, A = any> = (arg: A) => T
export type Fanc1 <T = any, A = any> = (arg: A) => Promise <T>
