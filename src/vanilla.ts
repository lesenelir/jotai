// 导出 原生的 atom 和 相关的类型
export { atom } from './vanilla/atom.ts'
export type { Atom, WritableAtom, PrimitiveAtom } from './vanilla/atom.ts' // 导出相关类型

// export { createStore, getDefaultStore } from './vanilla/store.ts'
import * as store from './vanilla/store.ts'
import * as store2 from './vanilla/store2.ts'

// createStore 和 getDefaultStore
// 并创建一个新的类型 CreateStore 和 GetDefaultStore
type CreateStore = typeof store.createStore
type GetDefaultStore = typeof store.getDefaultStore

// 导出变量值
export const createStore: CreateStore = import.meta.env?.USE_STORE2
  ? store2.createStore
  : store.createStore
export const getDefaultStore: GetDefaultStore = import.meta.env?.USE_STORE2
  ? store2.getDefaultStore
  : store.getDefaultStore

export type {
  Getter,
  Setter,
  ExtractAtomValue,
  ExtractAtomArgs,
  ExtractAtomResult,
  SetStateAction,
} from './vanilla/typeUtils.ts' // 导出 原生的 utils 的类型
