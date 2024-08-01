// postActions.js
import axios from "axios";
import {
  FETCH_POSTS_REQUEST,
  FETCH_POSTS_SUCCESS,
  FETCH_POSTS_FAILURE,
  FETCH_MORE_POSTS_SUCCESS,
} from "./actionType";
import { URL } from "../../utils/url";

export const fetchPostsRequest = () => ({
  type: FETCH_POSTS_REQUEST,
});

export const fetchPostsSuccess = (posts) => ({
  type: FETCH_POSTS_SUCCESS,
  payload: posts,
});
export const fetchMorePostsSuccess = (posts) => ({
    type: FETCH_MORE_POSTS_SUCCESS,
    payload: posts,
  });

export const fetchPostsFailure = (error) => ({
  type: FETCH_POSTS_FAILURE,
  payload: error,
});

export const fetchPosts = (user_id, token, page = 1) => {
    return async (dispatch) => {
      dispatch(fetchPostsRequest());
      try {
        const res = await axios.get(`${URL}/posts/paginationPost/${user_id}?page=${page}&limit=10`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = res.data.feed;
        if (page === 1) {
          dispatch(fetchPostsSuccess(data));
        } else {
          dispatch(fetchMorePostsSuccess(data)); // Dispatching fetchMorePostsSuccess for additional pages
        }
      } catch (error) {
        dispatch(fetchPostsFailure('Failed to load posts'));
      }
    };
  };
