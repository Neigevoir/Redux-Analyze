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

const EMPTY_ARRAY = [] // 不进行更新时的state设置
const NO_SUBSCRIPTION_ARRAY = [null, null] // 不进行订阅的Subscription设置

// TIPS：将组件转化成为字符串
const stringifyComponent = Comp => {
  try {
    return JSON.stringify(Comp)
  } catch (err) {
    return String(Comp)
  }
}

// TIPS：创建一个Reducer，每次调用就count + 1，并将payload(latestStoreState，error)等存起来
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
    selectorFactory也即是finalPropsSelectorFactory，主要用来处理props
    通过options的pure来决定使用的合并props的处理方式
    pure的时候，可以直接拿结果，如果props没有改变，connectAdvanced shouldComponentUpdate可以返回false，不更新
    非pure的时候，直接拿新的props对象，进行更新
    具体实现和细节可以看connect/selectorFactory.js
  */
  selectorFactory,
  // options 对象:
  {
    getDisplayName = name => `ConnectAdvanced(${name})`, // 获取组件的displayName

    methodName = 'connectAdvanced', // 用来显示错误信息

    renderCountProp = undefined, // 已经被废弃

    shouldHandleStateChanges = true, // 即是Boolean(mapStateToProps)

    storeKey = 'store', // 已经被废弃

    withRef = false, // 已经被废弃

    forwardRef = false, // 在组件中是否有使用forwardRef，需要用户进行设置

    context = ReactReduxContext, // 默认值ReactReduxContext，即最顶层的provider，一般存放store

    ...connectOptions // 另外一些用户设置的options
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

    // TIPS：用selectorFactory函数生成新的Props
    function createChildSelector(store) {
      return selectorFactory(store.dispatch, selectorFactoryOptions)
    }

    // TIPS：如果是Pure会进行优化处理，具体可看Memo
    const usePureOnlyMemo = pure ? useMemo : callback => callback()

    // TIPS：最重要看这个，按流程看，我们先从return的东西反过来看
    function ConnectFunction(props) {
      /**
       * TIPS：流程3 都是由props传下来的信息，一般业务情况下也没有传propsContext, forwardedRef
       * wrapperProps就是connect的组件，本身是否有传递的props
       *  */
      const [propsContext, forwardedRef, wrapperProps] = useMemo(() => {
        const { forwardedRef, ...wrapperProps } = props
        return [props.context, forwardedRef, wrapperProps]
      }, [props])

      /**
       * TIPS：流程2 获取使用的Context，
       * 判断是使用propsContext(props，最近一层)还是Context(全局，最顶层)
       * 一般情况下都是使用Context(全局，最顶层)
       *  */
      const ContextToUse = useMemo(() => {
        return propsContext &&
          propsContext.Consumer &&
          isContextConsumer(<propsContext.Consumer />)
          ? propsContext
          : Context
      }, [propsContext, Context])

      // TIPS：生成contextValue
      const contextValue = useContext(ContextToUse)

      // TIPS：store必须是来自props，来自上下文context
      const didStoreComeFromProps = Boolean(props.store)
      const didStoreComeFromContext =
        Boolean(contextValue) && Boolean(contextValue.store)

      // Tips：如果props没有store，并且最顶层provider也没有，那就说明组件没有被包裹到<Provider store={store}>中
      invariant(
        didStoreComeFromProps || didStoreComeFromContext,
        `Could not find "store" in the context of ` +
          `"${displayName}". Either wrap the root component in a <Provider>, ` +
          `or pass a custom React context provider to <Provider> and the corresponding ` +
          `React context consumer to ${displayName} in connect options.`
      )

      const store = props.store || contextValue.store

      // TIPS：用Store传入生成props
      const childPropsSelector = useMemo(() => {
        return createChildSelector(store)
      }, [store])

      // TIPS：流程5 subscription，就是Subscription，具体可以看Subscription.js，它可以订阅和通知执行所有的订阅事件等
      const [subscription, notifyNestedSubs] = useMemo(() => {
        // Tips：如果不需要处理stateChanges，则不增加订阅
        if (!shouldHandleStateChanges) return NO_SUBSCRIPTION_ARRAY

        // Tips：生成一个新的Subscription，并且传入store
        const subscription = new Subscription(
          store,
          didStoreComeFromProps ? null : contextValue.subscription, // 如props传下来的store，则订阅到该store里，否则增加到最顶层的provider的订阅中
          '试一下'
        )

        // Tips：暴露出notifyNestedSubs，并将subscription的notifyNestedSubs，bind到当前subscription
        const notifyNestedSubs = subscription.notifyNestedSubs.bind(
          subscription
        )

        return [subscription, notifyNestedSubs]
      }, [store, didStoreComeFromProps, contextValue])

      /**
       * 流程4 判断是否需要返回subscription订阅
       */
      const overriddenContextValue = useMemo(() => {
        /**
         * TIPS：如果store从props传下来，那就返回contextValue，否则需要加上subscription
         * 大多数都没有从props去传递store，更多是直接connect
         * 所以主要还是加上了订阅
         */
        if (didStoreComeFromProps) {
          return contextValue
        }

        return {
          ...contextValue,
          subscription
        }
      }, [didStoreComeFromProps, contextValue, subscription])

      // TIPS：应用了一个Reducer，用于更新，具体用法可以看官方useReducer，基本与Reducer相似
      const [
        [previousStateUpdateResult], // [previousStateUpdateResult] = [action.payload, updateCount + 1]
        forceComponentUpdateDispatch
      ] = useReducer(storeStateUpdatesReducer, EMPTY_ARRAY, initStateUpdates)

      // TIPS：判断更新结果是否有error，有则抛出error
      if (previousStateUpdateResult && previousStateUpdateResult.error) {
        throw previousStateUpdateResult.error
      }

      // NOTE：初始化定义一些参数，用来保存数据和状态
      const lastChildProps = useRef() // 最后一次child的props，包含、dispatch、router等有中间件和父组件的props
      const lastWrapperProps = useRef(wrapperProps) // 最后一次渲染组件的Props，一个是父组件传的
      const childPropsFromStoreUpdate = useRef()
      // TIPS：是否Render已经被预约，防止造成多render
      const renderIsScheduled = useRef(false)

      // Tips：获取真实的child的props
      const actualChildProps = usePureOnlyMemo(() => {
        // TIPS：如果是从Store里面更新，并且props和上一个props相等，直接返回props，否则就创建一个新的props
        if (
          childPropsFromStoreUpdate.current &&
          wrapperProps === lastWrapperProps.current
        ) {
          return childPropsFromStoreUpdate.current
        }

        return childPropsSelector(store.getState(), wrapperProps)
      }, [store, previousStateUpdateResult, wrapperProps])

      /**
       * TIPS：流程6 当流程跑完我们按顺序看一下两个Effect
       * 该effect每次render都执行，作用在存储props，然后通知所有的订阅
       */
      useIsomorphicLayoutEffect(() => {
        // TIPS：一有更新就将props还有actualChildProps存起来
        lastWrapperProps.current = wrapperProps
        lastChildProps.current = actualChildProps
        renderIsScheduled.current = false

        // TIPS：如果props从Store里面更新，就重置childPropsFromStoreUpdate和执行全部订阅
        if (childPropsFromStoreUpdate.current) {
          childPropsFromStoreUpdate.current = null
          notifyNestedSubs()
        }
      })

      // TIPS：流程7 该Effect使用来处理是否更新
      useIsomorphicLayoutEffect(() => {
        if (!shouldHandleStateChanges) return

        // TIPS：判断是否已经取消订阅
        let didUnsubscribe = false
        // TIPS：判断是否有抛出error
        let lastThrownError = null

        // TIPS：和名字一样，作为判断是否要Update处理
        const checkForUpdates = () => {
          //TIPS：取消订阅不做处理
          if (didUnsubscribe) {
            return
          }

          // Tips：获取store的整个状态
          const latestStoreState = store.getState()

          let newChildProps, error
          try {
            // TIPS：将整个store的state和当前组件的WrapperProps生成一个最新的childProps
            newChildProps = childPropsSelector(
              latestStoreState,
              lastWrapperProps.current
            )
          } catch (e) {
            // Tips：看是否生成的过程中出错
            error = e
            lastThrownError = e
          }

          if (!error) {
            lastThrownError = null
          }

          // TIPS：生成的最新childProps和存起来的lastChildProps是否相等，并且会看render是否已经在进行
          if (newChildProps === lastChildProps.current) {
            if (!renderIsScheduled.current) {
              /**
               * TIPS：前后props相等而且不在render中，执行所有已经订阅的方法
               * notifyNestedSubs是new Subscription，后续的subscription.trySubscribe()，是将checkForUpdates绑定到
               * 顶层的subscription
               * 所以该方法不会造成死循环
               * */
              notifyNestedSubs()
            }
          } else {
            // TIPS：当前后props不相等，则将新的props存起来，并将renderIsScheduled设置为true，做好要update的准备
            lastChildProps.current = newChildProps
            childPropsFromStoreUpdate.current = newChildProps
            renderIsScheduled.current = true

            // TIPS：通过dispatch去update，刷新了当前这个Connect()(Components)
            forceComponentUpdateDispatch({
              type: 'STORE_UPDATED',
              payload: {
                latestStoreState,
                error
              }
            })
          }
        }

        // TIPS：将checkForUpdates这个方法放到onStateChange，然后trySubscribe去初始化注册，将onStateChange注册到store的订阅中
        subscription.onStateChange = checkForUpdates
        subscription.trySubscribe()

        // TIPS：首次的时候进行一次检查更新，确保准确性
        checkForUpdates()

        // TIPS：解绑订阅的事件
        const unsubscribeWrapper = () => {
          didUnsubscribe = true
          subscription.tryUnsubscribe()
          subscription.onStateChange = null

          if (lastThrownError) {
            throw lastThrownError
          }
        }

        return unsubscribeWrapper
      }, [store, subscription, childPropsSelector])

      // TIPS：对组件进行memo优化
      const renderedWrappedComponent = useMemo(
        () => <WrappedComponent {...actualChildProps} ref={forwardedRef} />,
        [forwardedRef, WrappedComponent, actualChildProps]
      )

      // TIPS：流程1-整个函数的返回，加上memo进行优化
      const renderedChild = useMemo(() => {
        /*
          TIPS：流程1.1-判断是否要处理state的改变
          即是Boolean(mapStateToProps)，如connect()()，则不需要处理state改变
          不需要处理的直接将组件render，需要的则包裹一个Provider
        */
        if (shouldHandleStateChanges) {
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

    // TIPS：Connect的参数配置，pure就加上memo，Connect即是ConnectFunction
    const Connect = pure ? React.memo(ConnectFunction) : ConnectFunction

    Connect.WrappedComponent = WrappedComponent
    Connect.displayName = displayName

    // TIPS：是否有使用forwardRef，一般情况下并不会用到，主要看Connect，hoistStatics函数看全文最上面
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

    return hoistStatics(Connect, WrappedComponent)
  }
}
