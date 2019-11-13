/* 
  TIPS：原始组件的所有静态方法全部拷贝给新组件
  class Demo extends React.Component{
    render(){
      return (<div>Demo</div>)
    }
  }
  Demo.test = () => console.log('test')
  在被高阶组件包裹后会失去test，const NewDemo = Hoc(Demo)
  typeof NewDemo.test === 'undefined' // true

  hoist-non-react-statics会自动处理这种绑定: https://reactjs.org/docs/higher-order-components.html#static-methods-must-be-copied-over
*/
import hoistStatics from 'hoist-non-react-statics'

import invariant from 'invariant'
import React, {
  useContext,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useReducer
} from 'react'
import { isValidElementType, isContextConsumer } from 'react-is'
import Subscription from '../utils/Subscription'

import { ReactReduxContext } from './Context'

// Define some constant arrays just to avoid re-creating these
const EMPTY_ARRAY = []
const NO_SUBSCRIPTION_ARRAY = [null, null]

// TIPS：将组件转化成为字符串
const stringifyComponent = Comp => {
  try {
    return JSON.stringify(Comp)
  } catch (err) {
    return String(Comp)
  }
}

// TIPS：创建一个Reducer
function storeStateUpdatesReducer(state, action) {
  const [, updateCount] = state
  return [action.payload, updateCount + 1]
}

// TIPS：惰性去初始化Reducer的state
const initStateUpdates = () => [null, 0]

// TIPS：判断使用Effect还是LayoutEffect，如果同构则使用useLayoutEffect
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect

//  Tips：connectAdvanced就是返回一个function组件，wrapWithConnect，并且设置好参数信息和验证
export default function connectAdvanced(
  /*
    selectorFactory is a func that is responsible for returning the selector function used to
    compute new props from state, props, and dispatch. For example:

      export default connectAdvanced((dispatch, options) => (state, props) => ({
        thing: state.things[props.thingId],
        saveThing: fields => dispatch(actionCreators.saveThing(props.thingId, fields)),
      }))(YourComponent)

    Access to dispatch is provided to the factory so selectorFactories can bind actionCreators
    outside of their selector as an optimization. Options passed to connectAdvanced are passed to
    the selectorFactory, along with displayName and WrappedComponent, as the second argument.

    Note that selectorFactory is responsible for all caching/memoization of inbound and outbound
    props. Do not use connectAdvanced directly without memoizing results between calls to your
    selector, otherwise the Connect component will re-render on every state or props change.
  */
  selectorFactory,
  // options object:
  {
    // the func used to compute this HOC's displayName from the wrapped component's displayName.
    // probably overridden by wrapper functions such as connect()
    getDisplayName = name => `ConnectAdvanced(${name})`,

    // shown in error messages
    // probably overridden by wrapper functions such as connect()
    methodName = 'connectAdvanced',

    // REMOVED: if defined, the name of the property passed to the wrapped element indicating the number of
    // calls to render. useful for watching in react devtools for unnecessary re-renders.
    renderCountProp = undefined,

    // determines whether this HOC subscribes to store changes
    shouldHandleStateChanges = true,

    // REMOVED: the key of props/context to get the store
    storeKey = 'store',

    // REMOVED: expose the wrapped component via refs
    withRef = false,

    // use React's forwardRef to expose a ref of the wrapped component
    forwardRef = false,

    // the context consumer to use
    context = ReactReduxContext,

    // additional options are passed through to the selectorFactory
    ...connectOptions
  } = {}
) {
  // Tips：验证和判断的信息
  invariant(
    renderCountProp === undefined,
    `renderCountProp is removed. render counting is built into the latest React Dev Tools profiling extension`
  )

  invariant(
    !withRef,
    'withRef is removed. To access the wrapped instance, use a ref on the connected component'
  )

  const customStoreWarningMessage =
    'To use a custom Redux store for specific components, create a custom React context with ' +
    "React.createContext(), and pass the context object to React Redux's Provider and specific components" +
    ' like: <Provider context={MyContext}><ConnectedComponent context={MyContext} /></Provider>. ' +
    'You may also pass a {context : MyContext} option to connect'

  invariant(
    storeKey === 'store',
    'storeKey has been removed and does not do anything. ' +
      customStoreWarningMessage
  )

  const Context = context

  // Tips：包裹的组件，connect()(WrappedComponent: <Test />)，
  return function wrapWithConnect(WrappedComponent) {
    // TIPS：如果非生产环境需要判断一下element类型
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        isValidElementType(WrappedComponent),
        `You must pass a component to the function returned by ` +
          `${methodName}. Instead received ${stringifyComponent(
            WrappedComponent
          )}`
      )
    }

    // TIPS：处理好组件名、还有一些options的设置
    const wrappedComponentName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component'

    const displayName = getDisplayName(wrappedComponentName)

    const selectorFactoryOptions = {
      ...connectOptions,
      getDisplayName,
      methodName,
      renderCountProp,
      shouldHandleStateChanges,
      storeKey,
      displayName,
      wrappedComponentName,
      WrappedComponent
    }

    const { pure } = connectOptions

    // TIPS：用工厂函数生成新的props
    function createChildSelector(store) {
      return selectorFactory(store.dispatch, selectorFactoryOptions)
    }

    // If we aren't running in "pure" mode, we don't want to memoize values.
    // To avoid conditionally calling hooks, we fall back to a tiny wrapper
    // that just executes the given callback immediately.

    // TIPS：如果是Pure会进行优化处理，具体可看Memo
    const usePureOnlyMemo = pure ? useMemo : callback => callback()

    // TIPS：最重要看这个，按流程看，我们先从return的东西反过来看
    function ConnectFunction(props) {
      // TIPS：1.6 都是由props传下来的信息，一般业务情况下也没有传propsContext, forwardedRef
      const [propsContext, forwardedRef, wrapperProps] = useMemo(() => {
        // Distinguish between actual "data" props that were passed to the wrapper component,
        // and values needed to control behavior (forwarded refs, alternate context instances).
        // To maintain the wrapperProps object reference, memoize this destructuring.
        const { forwardedRef, ...wrapperProps } = props
        return [props.context, forwardedRef, wrapperProps]
      }, [props])

      // TIPS：1.5获取使用的Context，判断是propsContext(props，最近一层)还是Context(全局，最顶层)，
      const ContextToUse = useMemo(() => {
        // Users may optionally pass in a custom context instance to use instead of our ReactReduxContext.
        // Memoize the check that determines which context instance we should use.
        return propsContext &&
          propsContext.Consumer &&
          isContextConsumer(<propsContext.Consumer />)
          ? propsContext
          : Context
      }, [propsContext, Context])

      // Retrieve the store and ancestor subscription via context, if available
      // TIPS：流程1.4 生成contextValue
      const contextValue = useContext(ContextToUse)

      // The store _must_ exist as either a prop or in context
      const didStoreComeFromProps = Boolean(props.store)
      const didStoreComeFromContext =
        Boolean(contextValue) && Boolean(contextValue.store)

      invariant(
        didStoreComeFromProps || didStoreComeFromContext,
        `Could not find "store" in the context of ` +
          `"${displayName}". Either wrap the root component in a <Provider>, ` +
          `or pass a custom React context provider to <Provider> and the corresponding ` +
          `React context consumer to ${displayName} in connect options.`
      )

      const store = props.store || contextValue.store

      // TIPS：生成一个Store
      const childPropsSelector = useMemo(() => {
        // The child props selector needs the store reference as an input.
        // Re-create this selector whenever the store changes.
        return createChildSelector(store)
      }, [store])

      // TIPS：1.3 subscription，就是Subscription，具体可以看Subscription.js，它可以订阅和通知执行所有的订阅事件等
      const [subscription, notifyNestedSubs] = useMemo(() => {
        if (!shouldHandleStateChanges) return NO_SUBSCRIPTION_ARRAY

        // This Subscription's source should match where store came from: props vs. context. A component
        // connected to the store via props shouldn't use subscription from context, or vice versa.
        const subscription = new Subscription(
          store,
          didStoreComeFromProps ? null : contextValue.subscription
        )

        // `notifyNestedSubs` is duplicated to handle the case where the component is unmounted in
        // the middle of the notification loop, where `subscription` will then be null. This can
        // probably be avoided if Subscription's listeners logic is changed to not call listeners
        // that have been unsubscribed in the  middle of the notification loop.
        const notifyNestedSubs = subscription.notifyNestedSubs.bind(
          subscription
        )

        return [subscription, notifyNestedSubs]
      }, [store, didStoreComeFromProps, contextValue])

      // Determine what {store, subscription} value should be put into nested context, if necessary,
      // and memoize that value to avoid unnecessary context updates.

      // TIPS：流程1.2 判断是否需要返回subscription订阅
      const overriddenContextValue = useMemo(() => {
        // TIPS：如果store从props传下来，那就返回contextValue，否则需要加上subscription
        if (didStoreComeFromProps) {
          // This component is directly subscribed to a store from props.
          // We don't want descendants reading from this store - pass down whatever
          // the existing context value is from the nearest connected ancestor.
          return contextValue
        }

        // Otherwise, put this component's subscription instance into context, so that
        // connected descendants won't update until after this component is done
        return {
          ...contextValue,
          subscription
        }
      }, [didStoreComeFromProps, contextValue, subscription])

      // We need to force this wrapper component to re-render whenever a Redux store update
      // causes a change to the calculated child component props (or we caught an error in mapState)

      // TIPS：应以了一个Reducer，用于更新，具体用法可以看官方useReducer，基本与Reducer相似
      const [
        [previousStateUpdateResult],
        forceComponentUpdateDispatch
      ] = useReducer(storeStateUpdatesReducer, EMPTY_ARRAY, initStateUpdates)

      // TIPS：判断更新结果是否有error
      if (previousStateUpdateResult && previousStateUpdateResult.error) {
        throw previousStateUpdateResult.error
      }

      // Set up refs to coordinate values between the subscription effect and the render logic
      // NOTE：初始化定义一些参数
      const lastChildProps = useRef()
      const lastWrapperProps = useRef(wrapperProps)
      const childPropsFromStoreUpdate = useRef()
      // TIPS：是否Render已经被预约，防止造成多render
      const renderIsScheduled = useRef(false)

      const actualChildProps = usePureOnlyMemo(() => {
        // Tricky logic here:
        // - This render may have been triggered by a Redux store update that produced new child props
        // - However, we may have gotten new wrapper props after that
        // If we have new child props, and the same wrapper props, we know we should use the new child props as-is.
        // But, if we have new wrapper props, those might change the child props, so we have to recalculate things.
        // So, we'll use the child props from store update only if the wrapper props are the same as last time.
        // TIPS：如果是从Store里面更新，并且props和上一个props相等，直接返回从store更新的state，否则就创建一个新的props
        if (
          childPropsFromStoreUpdate.current &&
          wrapperProps === lastWrapperProps.current
        ) {
          return childPropsFromStoreUpdate.current
        }

        // TODO We're reading the store directly in render() here. Bad idea?
        // This will likely cause Bad Things (TM) to happen in Concurrent Mode.
        // Note that we do this because on renders _not_ caused by store updates, we need the latest store state
        // to determine what the child props should be.
        return childPropsSelector(store.getState(), wrapperProps)
      }, [store, previousStateUpdateResult, wrapperProps])

      // We need this to execute synchronously every time we re-render. However, React warns
      // about useLayoutEffect in SSR, so we try to detect environment and fall back to
      // just useEffect instead to avoid the warning, since neither will run anyway.

      // TIPS：1.7 当流程跑完我们按顺序看一下Effect，该effect每次render都执行，作用在存储props，然后通知所有的订阅
      useIsomorphicLayoutEffect(() => {
        // We want to capture the wrapper props and child props we used for later comparisons
        // TIPS：一有更新就将props还有actualChildProps存起来
        lastWrapperProps.current = wrapperProps
        lastChildProps.current = actualChildProps
        renderIsScheduled.current = false

        // If the render was from a store update, clear out that reference and cascade the subscriber update
        // TIPS：如果props从Store里面更新，就重制childPropsFromStoreUpdate和执行全部订阅
        if (childPropsFromStoreUpdate.current) {
          childPropsFromStoreUpdate.current = null
          notifyNestedSubs()
        }
      })

      // Our re-subscribe logic only runs when the store/subscription setup changes
      // TIPS：1.8 Effect
      useIsomorphicLayoutEffect(() => {
        // If we're not subscribed to the store, nothing to do here
        if (!shouldHandleStateChanges) return

        // Capture values for checking if and when this component unmounts
        // TIPS：判断是否已经取消订阅
        let didUnsubscribe = false
        // TIPS：判断是否有抛出error
        let lastThrownError = null

        // We'll run this callback every time a store subscription update propagates to this component
        // TIPS：和名字一样，作为判断是否要Update处理
        const checkForUpdates = () => {
          if (didUnsubscribe) {
            // Don't run stale listeners.
            // Redux doesn't guarantee unsubscriptions happen until next dispatch.
            return
          }

          const latestStoreState = store.getState()

          let newChildProps, error
          try {
            // Actually run the selector with the most recent store state and wrapper props
            // to determine what the child props should be
            // TIPS：生成最新的Store
            newChildProps = childPropsSelector(
              latestStoreState,
              lastWrapperProps.current
            )
          } catch (e) {
            error = e
            lastThrownError = e
          }

          if (!error) {
            lastThrownError = null
          }

          // If the child props haven't changed, nothing to do here - cascade the subscription update
          // TIPS：生成的最新Store和存起来的lastChildProps是否相等，并且会看render是否已经在进行
          if (newChildProps === lastChildProps.current) {
            if (!renderIsScheduled.current) {
              notifyNestedSubs()
            }
          } else {
            // Save references to the new child props.  Note that we track the "child props from store update"
            // as a ref instead of a useState/useReducer because we need a way to determine if that value has
            // been processed.  If this went into useState/useReducer, we couldn't clear out the value without
            // forcing another re-render, which we don't want.
            // TIPS：当前后props不相等，则将新的props存起来，并将renderIsScheduled设置为true，做好要update的准备
            lastChildProps.current = newChildProps
            childPropsFromStoreUpdate.current = newChildProps
            renderIsScheduled.current = true

            // If the child props _did_ change (or we caught an error), this wrapper component needs to re-render
            // TIPS：dispatch去update
            forceComponentUpdateDispatch({
              type: 'STORE_UPDATED',
              payload: {
                latestStoreState,
                error
              }
            })
          }
        }

        // Actually subscribe to the nearest connected ancestor (or store)
        // TIPS：将checkForUpdates这个方法放到onStateChange，然后trySubscribe去初始化注册，将onStateChange注册到store的订阅中
        subscription.onStateChange = checkForUpdates
        subscription.trySubscribe()

        // Pull data from the store after first render in case the store has
        // changed since we began.
        // TIPS：首次的时候进行一次检查更新，确保准确性
        checkForUpdates()

        // TIPS：解绑订阅的事件
        const unsubscribeWrapper = () => {
          didUnsubscribe = true
          subscription.tryUnsubscribe()
          subscription.onStateChange = null

          if (lastThrownError) {
            // It's possible that we caught an error due to a bad mapState function, but the
            // parent re-rendered without this component and we're about to unmount.
            // This shouldn't happen as long as we do top-down subscriptions correctly, but
            // if we ever do those wrong, this throw will surface the error in our tests.
            // In that case, throw the error from here so it doesn't get lost.
            throw lastThrownError
          }
        }

        return unsubscribeWrapper
      }, [store, subscription, childPropsSelector])

      // Now that all that's done, we can finally try to actually render the child component.
      // We memoize the elements for the rendered child component as an optimization.
      const renderedWrappedComponent = useMemo(
        () => <WrappedComponent {...actualChildProps} ref={forwardedRef} />,
        [forwardedRef, WrappedComponent, actualChildProps]
      )

      // If React sees the exact same element reference as last time, it bails out of re-rendering
      // that child, same as if it was wrapped in React.memo() or returned false from shouldComponentUpdate.

      // TIPS：流程1-整个函数的返回
      const renderedChild = useMemo(() => {
        // TIPS：流程1.1-判断是否要处理state的改变
        if (shouldHandleStateChanges) {
          // If this component is subscribed to store updates, we need to pass its own
          // subscription instance down to our descendants. That means rendering the same
          // Context instance, and putting a different value into the context.
          return (
            <ContextToUse.Provider value={overriddenContextValue}>
              {renderedWrappedComponent}
            </ContextToUse.Provider>
          )
        }

        return renderedWrappedComponent
      }, [ContextToUse, renderedWrappedComponent, overriddenContextValue])

      return renderedChild
    }

    // TIPS：Connect的参数配置，pure就加上memo
    const Connect = pure ? React.memo(ConnectFunction) : ConnectFunction

    Connect.WrappedComponent = WrappedComponent
    Connect.displayName = displayName

    // TIPS：是否有使用forwardRef，一般情况下并不会用到
    if (forwardRef) {
      const forwarded = React.forwardRef(function forwardConnectRef(
        props,
        ref
      ) {
        return <Connect {...props} forwardedRef={ref} />
      })

      forwarded.displayName = displayName
      forwarded.WrappedComponent = WrappedComponent
      return hoistStatics(forwarded, WrappedComponent)
    }

    // Tips：重点看这个
    return hoistStatics(Connect, WrappedComponent)
  }
}
