// postReducer.js
import { FETCH_POSTS_REQUEST, FETCH_POSTS_SUCCESS, FETCH_POSTS_FAILURE, FETCH_MORE_POSTS_SUCCESS } from './actionType';

const initialState = {
  loading: false,
  postData: [],
  error: null,
  page: 1,
};

const postReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_POSTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_POSTS_SUCCESS:
      return {
        ...state,
        loading: false,
        postData: action.payload,
        error: null,
        page: 1,
      };
    case FETCH_MORE_POSTS_SUCCESS:
      return {
        ...state,
        loading: false,
        postData: [...state.postData, ...action.payload],
        error: null,
        page: state.page + 1,
      };
    case FETCH_POSTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default postReducer;
