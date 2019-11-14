import * as Redux from '../../redux'
import Reducers from '../reducers/reducers'
import thunk from '../../redux-thunk'

const Store = ((Redux, Reducers) => {
  const preloadedState = window.__PRELOADED_STATE__,
    middleware = Redux.applyMiddleware(thunk),
    reducers = Redux.combineReducers({ ...Reducers })
  return Redux.createStore(reducers, preloadedState, Redux.compose(middleware))
})(Redux, Reducers)

export default Store
