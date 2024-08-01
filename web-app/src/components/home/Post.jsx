import React from "react";
import { Box, Input, Text, Image } from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { InputGroup, InputRightElement } from "@chakra-ui/react";
import { CiHeart } from "react-icons/ci";
import { FaHeart, FaRegCommentAlt, FaRegHeart } from "react-icons/fa";
import { TfiLoop } from "react-icons/tfi";

function Post({ post }) {
  console.log(post);
  return (
    <Box className="mt-4 flex flex-col gap-2">
      <Box className="mt-1 flex h-14 justify-between">
        <Box className="font-roboto flex gap-4">
          <Box className="w-14 rounded">
            <Image
              className="h-16 w-80 rounded"
              src={
                post.user_details.avatar ? `${post.user_details.avatar}` : ""
              }
            />
          </Box>
          <Box className="text-left">
            <Text className="text-lg font-medium">
              {post.user_details.first_name} {post.user_details.last_name}
            </Text>
            <Text className="text-xs">@{post.user_details.username}</Text>
            <Text className="text-xs">{post.ExectDate}</Text>
          </Box>

          {post.user_details.isverified ? (
            <Box>
              <Image
                className="blueTik"
                src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/postpage-svg/Bluetik.svg"
              />
            </Box>
          ) : (
            <Box></Box>
          )}

          <Box className="h-[58%] rounded shadow-md">
            <hr className="h-[10%] bg-yellow-400" />
            <Text>{post.user_details.items}</Text>
            <hr className="h-[10%] bg-blue-500" />
          </Box>
        </Box>

        <Box className="flex items-center gap-2">
          <Box className="cursor-pointer rounded border border-blue-800 px-1">
            <Text>{post.isFollowing ? "Following" : "Follow"}</Text>
          </Box>
          <Box>
            <BsThreeDotsVertical />
          </Box>
        </Box>
      </Box>
      <Box className="font-roboto text-left text-base">
        <Text>{post.text}</Text>
      </Box>

      <Box className="Postmedia">
        {/* {  Array.isArray(post.image) && post.image.length > 0 && (
          <Image src={post.image[0]} alt="Post Image" />
        )} */}
        {<Image src={post.image} />}
        
        </Box>

      <Box className="flex justify-between ">
        <Box className="flex gap-2 ">
          <Box className="flex gap-1 items-center">
            {post.isLiked ? (
              <FaHeart style={{ width: "30px", height: "30px",  color:"red" }} />
            ) : (
              <FaRegHeart style={{ width: "30px", height: "30px" }} />
            )}
            <Text>{post.likeCount}</Text>
          </Box>
          <Box className="flex gap-1 items-center">
            <FaRegCommentAlt style={{ width: "30px", height: "30px" }} />
            <Text>{post.commentsCount}</Text>
          </Box>
          <Box className="flex gap-1 items-center">
            <TfiLoop style={{ width: "30px", height: "30px" }} />
            <Text>{post.repostCount}</Text>
          </Box>
        </Box>
        <Box>
          <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/postpage-svg/saveLogo.svg" />
        </Box>
      </Box>

      <Box className="rounded border border-black ">
        <InputGroup>
          <InputRightElement pointerEvents="none" children={<Image src="" />} />
          <Input type="text" placeholder="comment here" />
        </InputGroup>
      </Box>
    </Box>
  );
}

export default Post;
