import { Button } from "@mui/material";
import { grey, primary, white } from "lib/style/colorPalette";
import React from "react";
import { BannerElement, ProfileImg } from "styled";

export default function User({ user }) {
  const handleFollow = (e) => {
    e.preventDefault();
  };
  return (
    <BannerElement to={`/${user.nickname ? user.nickname : user.userName}`}>
      <ProfileImg
        src={user.profileImg ? user.profileImg : user.imageUrl}
        alt={user.nickname ? user.nickname : user.userName}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>
          {user.nickname ? user.nickname : user.userName}
        </div>
        <div style={{ fontSize: "0.875rem", color: grey }}>
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
