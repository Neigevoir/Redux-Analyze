import { useContext } from 'react'
import { ReactReduxContext } from '../components/Context'
import { useReduxContext as useDefaultReduxContext } from './useReduxContext'

/**
 * TIPS：如果有传入context，并且和ReacReduxContext不一致则使用传入，否则使用ReactReduxContext，即Redux的provider数据
 *
 * @param {Function} [context=ReactReduxContext]
 * 传入一个context，默认为ReactReduxContext
 * @returns {Function}
 * return一个function用来获取provider的store
 */

export function createStoreHook(context = ReactReduxContext) {
  const useReduxContext =
    context === ReactReduxContext
      ? useDefaultReduxContext
      : () => useContext(context)
  return function useStore() {
    const { store } = useReduxContext()
    return store
  }
}

export const useStore = createStoreHook()
