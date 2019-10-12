import { Router, Route } from 'react-router-dom'
import { Provider, connect } from '../../react-redux'
import { useEffect, useContext, useReducer } from 'react'
import Store from 'src/app/store/store.js'
import Layout from './router.jsx'
import { persistor } from 'src/app/store/store.js'
import { PersistGate } from 'redux-persist/es/integration/react'
import Actions from 'src/app/actions/actions'
import { createBrowserHistory } from 'history'
const history = createBrowserHistory()

function openDarkMode() {
  const script = document.createElement('script')
  script.src =
    'https://cdn.jsdelivr.net/npm/darkmode-js@1.4.0/lib/darkmode-js.min.js'
  document.getElementsByTagName('head')[0].appendChild(script)
  script.onload = () => {
    const Darkmode = window.Darkmode
    new Darkmode().showWidget()
  }
}
openDarkMode()

function TestRender(props) {
  console.log(props)
  function handleClick() {
    props.dispatch(Actions.common.TestRedux())
  }
  return <div onClick={handleClick}>test</div>
}

function getState(state) {
  const { test } = state.common
  return {
    test
  }
}
const Test = connect(getState)(TestRender)

const Qwe = () => {
  console.log('qwe')
  return <div>QWE</div>
}

export default function First() {
  return (
    <Provider store={Store}>
      <PersistGate persistor={persistor} loading={<div>Loading...</div>}>
        <Router history={history}>
          <Test />
        </Router>
      </PersistGate>
    </Provider>
  )
}

function App() {
  useEffect(() => {
    // fetch('http://localhost:8888/api/position/list', {
    //   method: 'POST',
    //   headers: {
    //     Accept: 'application/json', // needed for request.format.json?
    //     'Content-Type': 'application/json',
    //     'X-REQUESTED-WITH': 'XMLHttpRequest'
    //   },
    //   // mode: 'cors',
    //   body: JSON.stringify({
    //     test: 1
    //   }),
    //   credentials: 'same-origin'
    // }).then(response => {
    //   if (response.status >= 200 && response.status < 400) {
    //     // success
    //     response
    //       .json()
    //       .then(data => {
    //         // body is json
    //         console.log(data)
    //       })
    //       .catch(e => {
    //         // body is not json -> sign out does this
    //         // errors can also get raised here from
    //         // invalid component render in response to success
    //         console.error(e)
    //       })
    //   }
    // })
    global.AvailWidth = window.screen.availWidth
    global.AvailHeight = window.screen.availWidth
  }, [])

  return (
    <Provider store={Store}>
      <PersistGate persistor={persistor} loading={<div>Loading...</div>}>
        <Router history={history}>
          <Route path="/" component={Layout} />
        </Router>
      </PersistGate>
    </Provider>
  )
}
