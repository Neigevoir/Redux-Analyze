import { bindActionCreators } from 'redux'

// TIPS：包装Actions
export default function wrapActionCreators(actionCreators) {
  return dispatch => bindActionCreators(actionCreators, dispatch)
}
