import http from "api/commonHttp";
import { dark_grey } from "lib/style/colorPalette";
import React, { useState } from "react";
import styled from "styled-components";

export default function Heart({ clicked, cnt, feedId }) {
  const [isHeart, setIsHeart] = useState(clicked);
  const [heart, setHeart] = useState(cnt);

  const handleLike = () => {
    if (isHeart) {
      http
        .delete("/feed/heart", feedId)
        .then(() => {
          setHeart(heart - 1);
          setIsHeart(false);
        })
        .catch((err) => {
          alert(err);
        });
    } else {
      http
        .post("feed/heart", feedId)
        .then(() => {
          setHeart(heart + 1);
          setIsHeart(true);
        })
        .catch((err) => {
          alert(err);
        });
    }
  };
  return (
    <HeartContainer onClick={handleLike}>
      {isHeart ? (
        <img src="/icons/feed/ic_heart.svg" alt="좋아요" />
      ) : (
        <img src="/icons/feed/ic_heart_empty.svg" alt="좋아요" />
      )}
      {heart}
    </HeartContainer>
  );
}

const HeartContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${dark_grey};
  font-weight: 500;
`;
