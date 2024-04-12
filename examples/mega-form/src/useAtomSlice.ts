import { useMemo } from 'react'
import { useAtom } from 'jotai'
import type { PrimitiveAtom } from 'jotai'
import { splitAtom } from 'jotai/utils'

// 自定义 hooks
// 参数：数组atom， 该参数是一个数组，元素是一个atom
const useAtomSlice = <Item>(arrAtom: PrimitiveAtom<Item[]>) => {
  // 通过splitAtom将数组atom转换为多个原子
  // 分割 atom，使之元素值成为独立的 atom
  // 使用 useMemo 包裹了一层，return 出的是一个 memoized 的 atoms 数组
  const [atoms, remove] = useAtom(useMemo(() => splitAtom(arrAtom), [arrAtom]))

  // return 一个 memoized 的数组，数组元素是一个元组，元组的第一个元素是一个 atom，第二个元素是一个函数
  return useMemo(
    () => atoms.map((itemAtom) => [itemAtom, () => remove(itemAtom)] as const),
    [atoms, remove],
  )
}

export default useAtomSlice
