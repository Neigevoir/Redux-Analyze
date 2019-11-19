import { useContext } from 'react'
import invariant from 'invariant'
import { ReactReduxContext } from '../components/Context'

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
