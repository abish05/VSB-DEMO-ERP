import * as React from 'react'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastState = {
  toasts: ToastProps[]
}

type Action =
  | { type: 'ADD_TOAST'; toast: ToastProps }
  | { type: 'REMOVE_TOAST'; toastId: string }

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const listeners: ((state: ToastState) => void)[] = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

export function toast(props: Omit<ToastProps, 'id'>) {
  const id = genId()
  dispatch({ type: 'ADD_TOAST', toast: { id, ...props } })
  setTimeout(() => {
    dispatch({ type: 'REMOVE_TOAST', toastId: id })
  }, props.duration || TOAST_REMOVE_DELAY)
  return id
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: 'REMOVE_TOAST', toastId: id }),
  }
}
