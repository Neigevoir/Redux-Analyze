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

export const useDispatch = createDispatchHook()
