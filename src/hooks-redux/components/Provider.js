import React, { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ReactReduxContext } from './Context'
import Subscription from '../utils/Subscription'

function Provider({ store, context, children }) {
  const contextValue = useMemo(() => {
    // TIPS：将Store生成一个订阅实例
    const subscription = new Subscription(store)
    // TIPS：将实例的通知订阅组的方法放到stateChange来处理
    subscription.onStateChange = subscription.notifyNestedSubs
    return {
      store,
      subscription
    }
  }, [store])

  // TIPS：用来保存Store的State
  const previousState = useMemo(() => store.getState(), [store])

  useEffect(() => {
    const { subscription } = contextValue
    // TIPS：初始化全部订阅
    subscription.trySubscribe()

    // TIPS：state有改变时，执行全部provider订阅的事件
    if (previousState !== store.getState()) {
      subscription.notifyNestedSubs()
    }
    return () => {
      // TIPS：解绑和重制onStateChange，因为redux的store那边注册了该方法
      subscription.tryUnsubscribe()
      subscription.onStateChange = null
    }
  }, [contextValue, previousState])

  const Context = context || ReactReduxContext

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

Provider.propTypes = {
  store: PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired
  }),
  context: PropTypes.object,
  children: PropTypes.any
}

export default Provider
