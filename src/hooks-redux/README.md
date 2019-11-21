# React-Redux Hooks版

看React-Redux的源码之前需要对于Redux有一点了解，如果在没有看Redxu或者不够了解，也不是不能够看React-Redux
只需要将Store理解成一个状态对象即可，至于里面包含了哪些可以不用理会


Hooks的React Redux对比以前用Connect简单不少，重点只要看Provider、useSelector和Subscription
其他的hooks和context，都是存储和创建store的context，hooks就直接使用store的contextValue

1、Provider
  1.先new Subscription，这个是Store的Subscription
  2.将Subscription的方法等注册，主要用来实现订阅和更新
  3.创建一个Provider，用来传递和存储Store和Subscription

2、useSelector
  1.先定义使用的effect和一些判断的工具函数
  2.定义reducer用来进行state的更新
  3.new Subscription，这个是useSelector的Subscription，useSelector用在组件里面，一般就是当前组件的Subscription
  4.定义用来存储state和error等的变量
  5.处理好存储state和error的场景
  6.注册订阅和更新
  7.返回一个处理好Store的useSelector

3、Subscription(工具类)
  不存在流程等问题，主要作用就是用来生成一个可以订阅的类，重点可以了解实现的逻辑
  1、可以用增加和取消订阅；
  2、可以给当前Store或者一个订阅的类增加订阅的事件；
  3、可以初始化和通知全部已订阅的事件；


```
流程
  Store：指Redux生成的Store，里面包含dispatch、subscribe等
  store：指在一个应用中的状态树

            
    Context  ——————————————————————————————— Provider【传递Store和生成ProviderStore的订阅(Subscription)】
(生成用作全局Store的Context)
                                              ｜  ProviderStore订阅的执行，触发组件加入到
                                              ｜  ProviderStore的subcription的执行(即Uptdae方法)
      ｜                                                                                      |                      
                      (生成组件的subcription，绑定组件update                                        
                        到ProviderStore的Subscription)      绑定组件                                     
  useReduxContext  ———————————— useSelector  —————————————————————————————— components        |  ReduxStore的订阅的执行触发
(获取contextValue)                                  Update则刷新components  (四个Hooks函数皆可用)    ProviderStore订阅的执行
      ｜                                                                                 
                                                                  ｜                     
    useStore                                                      ｜ 调用dispatch              |     
(获取contextValue的store)                                          ｜
      ｜                                                                                         
                                                 触发ReduxStore本身的订阅组执行
  useDispatch   ————————————————————————————————————————————————————————————————————————>  Store(Redux生成的Store)       
(获取store的dispatch)
```

```javascript
import React, { useCallback } from 'react'
import { useDispatch, useReduxContext, useSelector } from 'react-redux'
export const CounterComponent = ({ value }) => {
  const dispatch = useDispatch()
  const { store } = useReduxContext()
  const storeSate = useStore()
  const counter = useSelector(state => state.counter)
  const increaseCounter = useCallback(() => dispatch({ type: 'increase-counter' }), [])
  return (
    <div>
      <span>{value}</span>
      <div>{store.getState()}</div>
      <div>{storeSate.getState()}</div>
      <button onClick={increaseCounter}>Increase {counter}</button>
    </div>
  )
}
```