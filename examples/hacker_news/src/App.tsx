import { Suspense } from 'react'
import { a, useSpring } from '@react-spring/web'
import Parser from 'html-react-parser'
import { Provider, atom, useAtom, useSetAtom } from 'jotai'

type PostData = {
  by: string
  descendants?: number
  id: number
  kids?: number[]
  parent: number
  score?: number
  text?: string
  time: number
  title?: string
  type: 'comment' | 'story'
  url?: string
}

// 原生原子
const postId = atom(9001)

// 派生可读原子，read function 可以是 async 的。
// 但这种没办法缓存上一次请求的数据，每次做切换的时候都会重新请求。
const postData = atom(async (get) => {
  const id = get(postId)
  const response = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
  )
  const data: PostData = await response.json()
  return data
})

function Id() {
  const [id] = useAtom(postId)
  const props = useSpring({ from: { id }, id, reset: true })
  return <a.h1>{props.id.to(Math.round)}</a.h1>
}

function Next() {
  // Use `useSetAtom` to avoid re-render
  // const [, setPostId] = useAtom(postId)
  const setPostId = useSetAtom(postId)
  return (
    <button onClick={() => setPostId((id) => id + 1)}>
      <div>→</div>
    </button>
  )
}

function PostTitle() {
  const [{ by, text, time, title, url }] = useAtom(postData)
  return (
    <>
      <h2>{by}</h2>
      <h6>{new Date(time * 1000).toLocaleDateString('en-US')}</h6>
      {title && <h4>{title}</h4>}
      {url && <a href={url}>{url}</a>}
      {text && <div>{Parser(text)}</div>}
    </>
  )
}

export default function App() {
  return (
    <Provider>
      <Id />
      <div>
        {/* suspense 边界 */}
        <Suspense fallback={<h2>Loading...</h2>}>
          <PostTitle />
        </Suspense>
      </div>
      <Next />
    </Provider>
  )
}
