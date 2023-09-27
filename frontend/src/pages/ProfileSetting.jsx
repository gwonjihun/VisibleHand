import React,  {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from "reducer/userReducer";
import http from "api/commonHttp";
import { useNavigate } from 'react-router-dom';
import Profile from 'components/user/login/Profile';
import Swal from "sweetalert2";

export default function ProfileSetting() {
  const user = useSelector((state) => state.user);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  //닉네임, 상태메시지 유효성
  const [nickname, setNickname] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const onChangeNick = (event) => {
    const newNickname = event.target.value;
    setNickname(newNickname);
    
    if(newNickname.length>32) {
      setErrors((prev) => ({
        ...prev,
        nickname: {
          ...prev.nickname,
          invalid: true,
        },
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        nickname: {
          ...prev.nickname,
          invalid: false,
        },
      }));
    }
  }

  const onChangeMsg = (event) => {
    const newStatusMsg = event.target.value;
    setStatusMsg(newStatusMsg);
    
    if(newStatusMsg.length>128) {
      setErrors((prev) => ({
        ...prev,
        statusMsg: {
          ...prev.statusMsg,
          invalid: true,
        },
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        statusMsg: {
          ...prev.statusMsg,
          invalid: false,
        },
      }));
    }
  }

  const [errors, setErrors] = useState({
    nickname: {
        invalid: false,
        message: "닉네임은 32글자 이하여야 합니다.",
    },
    statusMsg: {
        invalid: false,
        message: "상태메시지는 128자 이하여야 합니다.",
    }
  })
 
  //닉네임 중복 체크
  const [dupCheck, setDupCheck] = useState(false);

  const isDuplicatedNick = (nickname) => {
    if(nickname==null || nickname==="") {
      Swal.fire({icon: 'warning', title: "닉네임을 입력해주세요."});
      return;
    }

    http.get('/user/auth?nickname='+nickname)
    .then(({ data }) => {
      if(data.isDuplicated===0) {
        setDupCheck(true);
        Swal.fire({icon: 'success', title: "사용가능한 닉네임입니다."});
        setNickname(nickname);

      } else if(data.isDuplicated===1) {
        Swal.fire({icon: 'error', title: "사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해주세요."})
      }
    })
    .catch(error => {
      console.log(error);
    });  
  }

  //프로필 등록
  const setProfile = (event) => {
    event.preventDefault();

    if(!dupCheck) {
      Swal.fire({icon: 'warning', title: "닉네임 중복 확인을 완료해주세요."});
      return;
    }

    const fileInput = event.target.querySelector('input[type="file"]');
    const formData = new FormData();

    const req = {
      profile: {
        nickname: event.target.nickname.value,
        statusMsg: event.target.statusMsg.value,
      },
      snsEmail: user.snsEmail,
      provider: user.provider
    };

    formData.append(
      'userProfileReqDto',
      new Blob([JSON.stringify(req)], {
        type: 'application/json'
      })
    )
  
    if (fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
    }

    http.put('/user/auth/profile',
        formData,
        { headers: { 'content-type': `multipart/form-data` }
      })
      .then(response => {
          if(response.status===200) {
            dispatch(setUser({
              token: {
                accessToken: user.accessToken,
                refreshToken: user.accessToken,
              },
              user: {
                userId: user.userId,
                nickname: req.profile.nickname,
                snsEmail: user.snsEmail,
                provider: user.provider
              }
            }));
          }
          navigate('/signUp');
      })
      .catch(error => {
        console.log(error);
      });   
  }

  return (
    <Profile
      title={"프로필 설정"}
      onSubmit={setProfile}
      nickChange={onChangeNick}
      nickClick={() => isDuplicatedNick(nickname)}
      msgChange={onChangeMsg}
      nickError={errors.nickname.invalid ? errors.nickname.message : ''}
      msgError={errors.statusMsg.invalid ? errors.statusMsg.message : ''}
    >
    </Profile>
  );
}
