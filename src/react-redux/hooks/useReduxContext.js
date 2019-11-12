import { useContext } from 'react'
import invariant from 'invariant'
import { ReactReduxContext } from '../components/Context'

/**
 * A hook to access the value of the `ReactReduxContext`. This is a low-level
 * hook that you should usually not need to call directly.
 *
 * @returns {any} the value of the `ReactReduxContext`
 *
 * @example
 *
 * import React from 'react'
 * import { useReduxContext } from 'react-redux'
 *
 * export const CounterComponent = ({ value }) => {
 *   const { store } = useReduxContext()
 *   return <div>{store.getState()}</div>
 * }
 */

// TIPS：获取ReduxdContext的Value，一般用来拿Store
export function useReduxContext() {
  const contextValue = useContext(ReactReduxContext)

  // TIPS：确保组件处于Provider下
  invariant(
    contextValue,
    'could not find react-redux context value; please ensure the component is wrapped in a <Provider>'
  )

  return contextValue
}
