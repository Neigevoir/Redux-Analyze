import { Provider, connect } from '../react-redux'
import Store from 'src/app/store/store.js'
import Actions from 'src/app/actions/actions'

function getState(state) {
  return { test: state.common }
}

function First(props) {
  function handleClick(e) {
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
  function handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    props.dispatch(Actions.common.TestRedux())
  }
  return <div onClick={handleClick}>Second</div>
}
const Second = connect(getState)(SecondRender)

function FirstChild() {
  return <div>FirstChild</div>
}

const Test = connect()(TestRender)

function TestRender(props) {
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
