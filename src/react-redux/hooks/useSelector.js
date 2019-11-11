import {
  useReducer,
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
  useContext
} from 'react'
import invariant from 'invariant'
import { useReduxContext as useDefaultReduxContext } from './useReduxContext'
import Subscription from '../utils/Subscription'
import { ReactReduxContext } from '../components/Context'

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect in the browser. We need useLayoutEffect to ensure the store
// subscription callback always has the selector from the latest render commit
// available, otherwise a store update may happen between render and the effect,
// which may cause missed updates; we also must ensure the store subscription
// is created synchronously, otherwise a store update may occur before the
// subscription is created and an inconsistent state may be observed
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Tips：浅对比前后两个store的值
const refEquality = (a, b) => a === b

function useSelectorWithStoreAndSubscription(
  selector, //Tips：state => state.test
  equalityFn,
  store,
  contextSub
) {
  const [, forceRender] = useReducer(s => s + 1, 0)

  const subscription = useMemo(() => new Subscription(store, contextSub), [
    store,
    contextSub
  ])

  // TIPS：用来存储state和error信息
  const latestSubscriptionCallbackError = useRef()
  const latestSelector = useRef()
  const latestSelectedState = useRef()

  let selectedState

  try {
    // TIPS：如果Error并且，两个selector的值不相等，则重新计算
    if (
      selector !== latestSelector.current ||
      latestSubscriptionCallbackError.current
    ) {
      selectedState = selector(store.getState())
    } else {
      selectedState = latestSelectedState.current
    }
  } catch (err) {
    let errorMessage = `An error occured while selecting the store state: ${err.message}.`

    if (latestSubscriptionCallbackError.current) {
      errorMessage += `\nThe error may be correlated with this previous error:\n${latestSubscriptionCallbackError.current.stack}\n\nOriginal stack trace:`
    }

    throw new Error(errorMessage)
  }

  // TIPS：在执行effect时，将最新的selector存储
  useIsomorphicLayoutEffect(() => {
    latestSelector.current = selector
    latestSelectedState.current = selectedState
    latestSubscriptionCallbackError.current = undefined
  })

  // TIPS：当Store或subscription有改变的话，直接执行checkForUpdates
  useIsomorphicLayoutEffect(() => {
    // TIPS：对比前后selectState的值，全等则不做处理，有改变则将最新的值存储，并执行update的订阅
    function checkForUpdates() {
      try {
        const newSelectedState = latestSelector.current(store.getState())

        if (equalityFn(newSelectedState, latestSelectedState.current)) {
          return
        }

        latestSelectedState.current = newSelectedState
      } catch (err) {
        // we ignore all errors here, since when the component
        // is re-rendered, the selectors are called again, and
        // will throw again, if neither props nor store state
        // changed
        latestSubscriptionCallbackError.current = err
      }

      // TIPS：update，将最新的selectedState返回
      forceRender({})
    }

    // TIPS：在原先Store的subscription上增加订阅了checkForUpdates
    subscription.onStateChange = checkForUpdates
    subscription.trySubscribe()

    checkForUpdates()

    return () => subscription.tryUnsubscribe()
  }, [store, subscription])

  return selectedState
}

/**
 * Hook factory, which creates a `useSelector` hook bound to a given context.
 *
 * @param {Function} [context=ReactReduxContext] Context passed to your `<Provider>`.
 * @returns {Function} A `useSelector` hook bound to the specified context.
 */
export function createSelectorHook(context = ReactReduxContext) {
  const useReduxContext =
    context === ReactReduxContext
      ? useDefaultReduxContext
      : () => useContext(context)
  return function useSelector(selector, equalityFn = refEquality) {
    invariant(selector, `You must pass a selector to useSelectors`)

    // TIPS：关键点，获取当前Store的subscription和context的信息
    const { store, subscription: contextSub } = useReduxContext()

    // TIPS：等于在对当前Store进行了扩展和订阅
    return useSelectorWithStoreAndSubscription(
      selector,
      equalityFn,
      store,
      contextSub
    )
  }
}

/**
 * A hook to access the redux store's state. This hook takes a selector function
 * as an argument. The selector is called with the store state.
 *
 * This hook takes an optional equality comparison function as the second parameter
 * that allows you to customize the way the selected state is compared to determine
 * whether the component needs to be re-rendered.
 *
 * @param {Function} selector the selector function
 * @param {Function=} equalityFn the function that will be used to determine equality
 *
 * @returns {any} the selected state
 *
 * @example
 *
 * import React from 'react'
 * import { useSelector } from 'react-redux'
 *
 * export const CounterComponent = () => {
 *   const counter = useSelector(state => state.counter)
 *   return <div>{counter}</div>
 * }
 */
export const useSelector = createSelectorHook()
