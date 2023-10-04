import { Button } from "@mui/material";
import { grey, primary, white } from "lib/style/colorPalette";
import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { setUserId } from "reducer/mypageTabReducer";
import { BannerElement, ProfileImg } from "styled";
import { useDispatch } from "react-redux";

export default function User({ user }) {
  const navi = useNavigate();
  const dispatch = useDispatch();

  const handleFollow = (e) => {
    e.preventDefault();
  };

  const move = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(setUserId(user.userId));
    navi("/mypage")
  }

  useEffect(() => console.log(user), []);
  return (
    <BannerElement onClick={(e) => move(e)}>
      <ProfileImg
        src={
          user.profileImg || user.imageUrl
            ? user.profileImg
              ? user.profileImg
              : user.imageUrl
            : "/images/user/user_default.png"
        }
        alt={user.nickname ? user.nickname : user.userName}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>
          {user.nickname ? user.nickname : user.userName}
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            color: grey,
            marginTop: "4px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "235px",
          }}
        >
          {user.statusMsg}
        </div>
      </div>
      <Button
        style={{
          backgroundColor: primary,
          color: white,
          fontFamily: "Pretendard",
          borderRadius: "1rem",
          padding: "0.375rem 1rem",
        }}
        onClick={handleFollow}
      >
        팔로우
        <img
          src="/icons/feed/ic_account_plus.svg"
          alt="팔로우"
          style={{ marginLeft: "0.375rem" }}
        />
      </Button>
    </BannerElement>
  );
}
