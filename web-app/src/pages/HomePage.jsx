import { Box, Spinner, Text } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Post from "../components/home/Post";
import Navbar from "../components/navigations/Navbar";
import LeftBar from "../components/navigations/LeftBar";
import RightBar from "../components/navigations/RightBar";
import { fetchPosts } from "../redux/Post/action";

function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token, user_id, userdata } = useSelector((state) => state.auth);
  const { loading, error, page } = useSelector((state) => state.postReducer);
  const postData = useSelector((state) => state.postReducer.postData);

  const [appendedPosts, setAppendedPosts] = useState([]);
  const [fetchingMore, setFetchingMore] = useState(false);

  const handleScroll = useCallback(() => {
    const bottom =
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.scrollHeight;
    if (bottom && !loading && !fetchingMore) {
      setFetchingMore(true);
      dispatch(fetchPosts(user_id, token, page + 1)).then(() => {
        setFetchingMore(false);
      });
    }
  }, [dispatch, loading, user_id, token, page, fetchingMore]);

  useEffect(() => {
    if (token && user_id) {
      dispatch(fetchPosts(user_id, token));
    }
  }, [dispatch, token, user_id]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (postData?.length) {
      setAppendedPosts(postData);
    }
  }, [postData]);

  return (
    <div>
      <Navbar />
      <div className="flex justify-evenly">
        <LeftBar />
        <Box className="flex w-2/5 flex-col gap-4">
          {loading && appendedPosts.length === 0 ? (
            <Spinner size="xl" margin="auto" />
          ) : error ? (
            <Text color="red.500">{error}</Text>
          ) : (
            <>
              {appendedPosts.map((post) => (
                <Post key={post._id} post={post} />
              ))}
              {fetchingMore && <Spinner size="xl" margin="auto" />}
            </>
          )}
        </Box>
        <RightBar />
      </div>
    </div>
  );
}

export default HomePage;
