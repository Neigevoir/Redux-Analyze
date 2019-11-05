import { useEffect } from 'react'
import { Provider, connect } from '../react-redux'
import Store from 'src/app/store/store.js'
import Actions from 'src/app/actions/actions'

function getState(state) {
  return { test: state.common }
}

function First(props) {
  console.log(2)
  function handleClick(e) {
    console.log('aksd123')
    e.stopPropagation()
    e.preventDefault()
    props.dispatch(Actions.common.TestRedux())
  }
  return (
    <div onClick={handleClick}>
      First
      <FirstChild />
    </div>
  )
}

function SecondRender(props) {
  console.log(3)
  function handleClick(e) {
    console.log('aksd')
    e.stopPropagation()
    e.preventDefault()
    props.dispatch(Actions.common.TestRedux())
  }
  return <div onClick={handleClick}>Second</div>
}
const Second = connect(getState)(SecondRender)

function FirstChild() {
  console.log(4)
  return <div>FirstChild</div>
}

const Test = connect()(TestRender)

function TestRender(props) {
  console.log(1)

  function consoleTest() {
    console.log('test')
  }

  return (
    <div>
      <div onClick={consoleTest}>test</div>
      <First dispatch={props.dispatch} />
      <Second dispatch={props.dispatch} />
    </div>
  )
}

export default function App() {
  return (
    <Provider store={Store}>
      <Test />
    </Provider>
  )
}
