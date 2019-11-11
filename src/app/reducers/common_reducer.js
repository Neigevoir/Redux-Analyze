const initialState = {
  test: 0,
  pure: true
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'TEST_REDUX':
      return { ...state, test: state.test + 1 }
    default:
      return state
  }
}
