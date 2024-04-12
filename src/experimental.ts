// 导出 atom 和相关的类型
export { atom } from './vanilla/atom.ts'
export type { Atom, WritableAtom, PrimitiveAtom } from './vanilla/atom.ts'

export { createStore, getDefaultStore } from './vanilla/store2.ts'

// 导出 utils 中的工具类型
export type {
  Getter,
  Setter,
  ExtractAtomValue,
  ExtractAtomArgs,
  ExtractAtomResult,
  SetStateAction,
} from './vanilla/typeUtils.ts'
