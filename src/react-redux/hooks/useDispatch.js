import { ReactReduxContext } from '../components/Context'
import { useStore as useDefaultStore, createStoreHook } from './useStore'

// TIPS：和useStore同样逻辑，如有传入context则使用传入，否则使用useStore里的store，并且返回store的dispatch
export function createDispatchHook(context = ReactReduxContext) {
  const useStore =
    context === ReactReduxContext ? useDefaultStore : createStoreHook(context)
  return function useDispatch() {
    const store = useStore()
    return store.dispatch
  }
}

/**
 * A hook to access the redux `dispatch` function.
 *
 * @returns {any|function} redux store's `dispatch` function
 *
 * @example
 *
 * import React, { useCallback } from 'react'
 * import { useDispatch } from 'react-redux'
 *
 * export const CounterComponent = ({ value }) => {
 *   const dispatch = useDispatch()
 *   const increaseCounter = useCallback(() => dispatch({ type: 'increase-counter' }), [])
 *   return (
 *     <div>
 *       <span>{value}</span>
 *       <button onClick={increaseCounter}>Increase counter</button>
 *     </div>
 *   )
 * }
 */
export const useDispatch = createDispatchHook()
