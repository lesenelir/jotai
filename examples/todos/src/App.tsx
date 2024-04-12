import type { FormEvent } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { a, useTransition } from '@react-spring/web'
import { Radio } from 'antd'
import { Provider, atom, useAtom, useSetAtom } from 'jotai'
import type { PrimitiveAtom } from 'jotai'

type Todo = {
  title: string
  completed: boolean
}

// 原生原子
const filterAtom = atom('all') // 原子的内容
// 该数组是保存的原子，而不是值。所以，拿到这个数组的元素（原子），该要 get(item)，才能拿到原子的内容
const todosAtom = atom<PrimitiveAtom<Todo>[]>([])

// 只读派生原子
const filteredAtom = atom<PrimitiveAtom<Todo>[]>((get) => {
  const filter = get(filterAtom) // all | completed | incompleted
  const todos = get(todosAtom)
  if (filter === 'all') return todos
  else if (filter === 'completed')
    // todos 是一个原子数组，所以这里数组元素是原子，要 get(atom) 才能拿到原子的内容
    return todos.filter((atom) => get(atom).completed)  //  get 在派生中可以代表订阅关系，在这里是获取原子的内容
  else return todos.filter((atom) => !get(atom).completed)
})


type RemoveFn = (item: PrimitiveAtom<Todo>) => void

interface ITodoItemProps {
  atom: PrimitiveAtom<Todo>
  remove: RemoveFn
}

const TodoItem = ({ atom, remove }: ITodoItemProps) => {
  const [item, setItem] = useAtom(atom)
  const toggleCompleted = () =>
    setItem((props) => ({ ...props, completed: !props.completed }))
  return (
    <>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={toggleCompleted}
      />
      <span style={{ textDecoration: item.completed ? 'line-through' : '' }}>
        {item.title}
      </span>
      <CloseOutlined onClick={() => remove(atom)} />
    </>
  )
}

const Filter = () => {
  const [filter, set] = useAtom(filterAtom)
  return (
    <Radio.Group onChange={(e) => set(e.target.value)} value={filter}>
      <Radio value="all">All</Radio>
      <Radio value="completed">Completed</Radio>
      <Radio value="incompleted">Incompleted</Radio>
    </Radio.Group>
  )
}


type FilteredType = {
  remove: RemoveFn
}
const Filtered = (props: FilteredType) => {
  const [todos] = useAtom(filteredAtom)
  const transitions = useTransition(todos, {
    keys: (todo) => todo.toString(),
    from: { opacity: 0, height: 0 },
    enter: { opacity: 1, height: 40 },
    leave: { opacity: 0, height: 0 },
  })
  return transitions((style, atom) => (
    <a.div className="item" style={style}>
      <TodoItem atom={atom} {...props} />
    </a.div>
  ))
}


const TodoList = () => {
  const setTodos = useSetAtom(todosAtom)

  const remove: RemoveFn = (todo) =>
    setTodos((prev) => prev.filter((item) => item !== todo))

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const title = e.currentTarget.inputTitle.value
    e.currentTarget.inputTitle.value = ''
    setTodos((prev) => [...prev, atom<Todo>({ title, completed: false })])
  }
  return (
    <form onSubmit={add}>
      <Filter />
      <input name="inputTitle" placeholder="Type ..." />
      <Filtered remove={remove} />
    </form>
  )
}

export default function App() {
  return (
    <Provider>
      <h1>Jōtai</h1>
      <TodoList />
    </Provider>
  )
}
