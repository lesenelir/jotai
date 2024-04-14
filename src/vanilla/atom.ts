// 1. Getter 和 Setter 类型

// Getter 函数类型： 接受一个泛型参数 Value，参数是 Atom<Value> 类型， 返回一个 Value 类型的值
// 修饰 get 函数，接受一个 Atom 类型的参数，返回一个 Value 类型的值
type Getter = <Value>(atom: Atom<Value>) => Value

// Setter 函数类型： 接受三个泛型参数 Value, Args, Result，其中 Args 是一个数组， Result 是一个泛型参数
// Setter 函数类型 是作为 atom(read, (get, set, update) => void) , set 变量的类型
// Result 一般都是 void
// 修改 atom 中的 set 函数，有两个参数，atom 参数是要被修改原子的 atom，args 是更新函数的参数（一般就是一个value）
type Setter = <Value, Args extends unknown[], Result>(
  atom: WritableAtom<Value, Args, Result>, // WritableAtom 类型
  ...args: Args
) => Result

/*
const priceAtom = atom<number>(10)

const readAtom = atom((get: Getter) => { // Getter 函数
  const primitivePrice = get(priceAtom) // 接受一个 Atom 类型的参数，返回一个 Value 类型的值
  return primitivePrice * 2
})

const writeOnlyPriceAtom: WritableAtom<null, [{   type: string   data: number }], void> & WithInitialValue<null>
  = atom<null, [{type: string, data: number}], void>(
  null,
  (get: Getter, set: Setter, update: {type: string, data: number}) => {
    // set(priceAtom, price => price + update.data)
    const primitivePrice = get(priceAtom)
    set(priceAtom, primitivePrice + update.data)
  }
)
*/

type SetAtom<Args extends unknown[], Result> = <A extends Args>(
  ...args: A
) => Result

/**
 * setSelf is for internal use only and subject to change without notice.
 */
// Read 类型返回一个 Value 类型的值
type Read<Value, SetSelf = never> = (
  get: Getter,
  options: { readonly signal: AbortSignal; readonly setSelf: SetSelf },
) => Value

// atom(read: Read, write: Write) 的 write 函数类型
type Write<Args extends unknown[], Result> = (
  get: Getter,
  set: Setter,
  ...args: Args
) => Result

// This is an internal type and not part of public API.
// Do not depend on it as it can change without notice.
// 一个原子的初始化值
type WithInitialValue<Value> = {
  init: Value
}

type OnUnmount = () => void

type OnMount<Args extends unknown[], Result> = <
  S extends SetAtom<Args, Result>,
>(
  setAtom: S,
) => OnUnmount | void

// -----------------------------------------------------------------------------

// 2. Atom 类型 和 WritableAtom 类型

// Atom 类型是一个对象，包含了一个 toString 方法，一个 read 方法，一个 unstable_is 方法，一个 debugLabel 属性，一个 debugPrivate 属性
export interface Atom<Value> {
  toString: () => string
  read: Read<Value>
  unstable_is?(a: Atom<unknown>): boolean
  debugLabel?: string
  /**
   * To ONLY be used by Jotai libraries to mark atoms as private. Subject to change.
   * @private
   */
  debugPrivate?: boolean
}

// 可以被写入的原子
// WritableAtom 类型是一个对象，包含了一个 toString 方法，一个 read 方法，一个 write 方法，一个 onMount 方法
// WritableAtom 类型受限于 Atom 类型, 在 Atom 类型的基础上，又扩展了更多的方法
export interface WritableAtom<Value, Args extends unknown[], Result>
  extends Atom<Value> {
  read: Read<Value, SetAtom<Args, Result>> // 重写 read 方法
  write: Write<Args, Result> // 子类型更加的具体，多了一个 write 方法
  onMount?: OnMount<Args, Result>
}

type SetStateAction<Value> = Value | ((prev: Value) => Value)

// 原生原子的类型， 是一个可读可写的原子
export type PrimitiveAtom<Value> = WritableAtom<
  Value,
  [SetStateAction<Value>],
  void
>

// -----------------------------------------------------------------------------

// 3. atom 函数签名和实现

let keyCount = 0 // global key count for all atoms

// writable derived atom
// 函数签名，当有 read 和 write 两个参数时，返回一个 WritableAtom 类型的对象，说明这个原子既是可读的，也是可写的。只读只写原子
export function atom<Value, Args extends unknown[], Result>(
  read: Read<Value, SetAtom<Args, Result>>,
  write: Write<Args, Result>,
): WritableAtom<Value, Args, Result>

// read-only derived atom
// 函数签名，当只有 read 一个参数时，返回一个 Atom 类型的对象，说明这个原子只是可读的。只读原子
export function atom<Value>(read: Read<Value>): Atom<Value>

// write-only derived atom
// 函数签名，当只有 write 一个参数时，返回一个 WritableAtom 类型的对象，说明这个原子只是可写的。只写原子
export function atom<Value, Args extends unknown[], Result>(
  initialValue: Value,
  write: Write<Args, Result>,
): WritableAtom<Value, Args, Result> & WithInitialValue<Value>

// primitive atom
// 原生原子 atom 函数签名
export function atom<Value>(
  initialValue: Value,
): PrimitiveAtom<Value> & WithInitialValue<Value>

export function atom<Value, Args extends unknown[], Result>(
  read: Value | Read<Value, SetAtom<Args, Result>>, // read 可以是一个 value（状态值），也可以是一个函数
  write?: Write<Args, Result>,
) {
  const key = `atom${++keyCount}` // 当前原子的 key， 用于标识当前原子的唯一性

  // atom 函数最后会返回一个当前的原子对象
  const config = {
    toString: () => key,
  } as WritableAtom<Value, Args, Result> & { init?: Value }

  if (typeof read === 'function') {
    // 修改 config 对象的 read 方法
    config.read = read as Read<Value, SetAtom<Args, Result>>
  } else {
    // read 是一个值， init 就是这个值
    config.init = read
    config.read = defaultRead
    config.write = defaultWrite as unknown as Write<Args, Result>
  }

  if (write) {
    config.write = write
  }

  return config
}

// -----------------------------------------------------------------------------

// 4. 默认的 read 和 write 方法 （内部的方法）

function defaultRead<Value>(this: Atom<Value>, get: Getter) {
  return get(this)
}

function defaultWrite<Value>(
  this: PrimitiveAtom<Value>,
  get: Getter,
  set: Setter,
  arg: SetStateAction<Value>,
) {
  return set(
    this,
    typeof arg === 'function'
      ? (arg as (prev: Value) => Value)(get(this))
      : arg,
  )
}
