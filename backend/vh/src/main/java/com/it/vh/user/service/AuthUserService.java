package com.it.vh.user.service;

import com.it.vh.common.util.jwt.JwtTokenProvider;
import com.it.vh.common.util.jwt.dto.TokenInfo;
import com.it.vh.user.api.dto.auth.AuthTokenInfo;
import com.it.vh.user.api.dto.auth.AuthUserInfo;
import com.it.vh.user.api.dto.auth.KakaoUserInfo;
import com.it.vh.user.api.dto.auth.LoginResDto;
import com.it.vh.user.api.dto.auth.LoginResDto.UserProfile;
import com.it.vh.user.domain.entity.User;
import com.it.vh.user.domain.repository.UserRespository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class AuthUserService {

    private final InMemoryClientRegistrationRepository inMemoryRepository;
    private final UserRespository userRespository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRedisService userRedisService;

    @Transactional
    public LoginResDto login(String code) {
        ClientRegistration provider = inMemoryRepository.findByRegistrationId("kakao");

        //카카오 토큰 받기
        AuthTokenInfo token = getToken(code, provider);

        //가입 또는 로그인 처리
        User user = getUser(token, provider);
        log.info("[유저] user: {}", user);

        UserProfile userProfile = UserProfile.from(user);

        //권한 설정
        log.info("----------권한 설정 시작----------");
        Authentication authentication = jwtTokenProvider.setAuthentication(user);
        log.info("등록 중 auth: {}", authentication);

        TokenInfo tokenInfo = jwtTokenProvider.generateToken(authentication);
        log.info("등록 중 token: {}", tokenInfo);
        log.info("----------권한 설정 끝----------");

        log.info("----------권한 확인 시작----------");
        Authentication auth2 = SecurityContextHolder.getContext().getAuthentication();
        log.info("등록 후 auth: {}", auth2);

        Long num = Long.parseLong(auth2.getName());
        log.info("userId 확인: {}", num);
        log.info("----------권한 확인 끝----------");

        //레디스에 리프레시 토큰 저장
        userRedisService.saveRefreshToken(String.valueOf(user.getUserId()), token.getRefresh_token());

        //-------------------------------------------------
        //일단은 DTO로 가지고 있다가 프로필 작성 후 가입 또는 로그인 처리
//        UserDto userDto = getUser2(token, provider);
//        log.info("userId: {}", userDto.getUserId());

//        UserProfile userProfile = UserProfile.builder()
//            .userId(userDto.getUserId())
//            .nickname(userDto.getNickname())
//            .statusMsg(userDto.getStatusMsg())
//            .profileImg(userDto.getProfileImg())
//            .snsEmail(userDto.getSnsEmail())
//            .build();

//        //하지만 이미 가입된 회원은
//        //로그인 시 jwt 토큰 발급
//        //근데 일단은 이 주소로 요청 들어오면 다 토큰 발급되도록 해놓음
//        if (userDto.getUserId() != null) {
//            String accessToken = jwtTokenProvider.createAccessToken(userDto.getUserId());
//            String refreshToken = jwtTokenProvider.createRefreshToken(userDto.getUserId());
//
//            String accessToken = jwtTokenProvider.createAccessToken(userDto.getUserId());
//            String refreshToken = jwtTokenProvider.createRefreshToken(userDto.getUserId());
//
//            TokenInfo tokenInfo = TokenInfo.builder()
//                .accessToken(accessToken)
//                .refreshToken(refreshToken)
//                .build();
//
//            return LoginResDto.builder()
//                .user(userProfile)
//                .token(tokenInfo)
//                .build();
//        }

        return LoginResDto.builder()
                .user(userProfile)
                .token(tokenInfo)
                .build();
    }

    private AuthTokenInfo getToken(String code, ClientRegistration provider) {
        return WebClient.create()
                .post()
                .uri(provider.getProviderDetails().getTokenUri())
                .headers(header -> {
                    header.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    header.setAcceptCharset(Collections.singletonList(StandardCharsets.UTF_8));
                })
                .bodyValue(tokenRequest(code, provider))
                .retrieve()
                .bodyToMono(AuthTokenInfo.class)
                .block();
    }

    private MultiValueMap<String, String> tokenRequest(String code, ClientRegistration provider) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "authorization_code");
        formData.add("client_id", provider.getClientId());
        formData.add("redirect_uri", provider.getRedirectUri());
        formData.add("code", code);
        formData.add("client_secret", provider.getClientSecret());
        return formData;
    }

    //-------------------------------------------------
    //일단은 DTO로 가지고 있다가 프로필 작성 후 가입 또는 로그인 처리
//    private UserDto getUser2(AuthTokenInfo token, ClientRegistration provider) {
//        Map<String, Object> userAttributes = getUserAttributes(token, provider);
//
//        AuthUserInfo oAuth2UserInfo = new KakaoUserInfo(userAttributes);
//        String snsEmail = oAuth2UserInfo.getEmail();
//        Optional<User> findUser = userRespository.findBySnsEmail(snsEmail);
//
//        if (findUser.isPresent()) {
//            log.info(">>>>> 이미 등록된 사용자");
//            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//            log.info("auth: {}", auth.getName());
//            return UserDto.from(findUser.get());
//        }
//
//        UserDto userDto = UserDto.builder().snsEmail(snsEmail).build();
//        return userDto;
//    }

    @Transactional
    public User getUser(AuthTokenInfo token, ClientRegistration provider) {
        Map<String, Object> userAttributes = getUserAttributes(token, provider);

        AuthUserInfo oAuth2UserInfo = new KakaoUserInfo(userAttributes);
        String snsEmail = oAuth2UserInfo.getEmail();

        Optional<User> findUser = userRespository.findBySnsEmail(snsEmail);
        if (findUser.isPresent()) {
            log.info("[이미 등록된 사용자] userId: {}", findUser.get().getUserId());
            return findUser.get();
        }

        User saveUser = User.builder()
                .nickname("testNick")
                .profileImg("testImg")
                .statusMsg("testMsg")
                .snsEmail(snsEmail)
                .build();
        userRespository.save(saveUser);
        log.info("[가입완료] userId: {}", saveUser.getUserId());
        return saveUser;
    }

    private Map<String, Object> getUserAttributes(AuthTokenInfo token,
                                                  ClientRegistration provider) {
        return WebClient.create()
                .get()
                .uri(provider.getProviderDetails().getUserInfoEndpoint().getUri())
                .headers(header -> {
                    header.setBearerAuth(token.getAccess_token());
                })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                })
                .block();
    }

    public void logout(Long userId) {
        WebClient.ResponseSpec res = WebClient.create()
                .post()
                .uri("https://kapi.kakao.com/v1/user/unlink")
//            .headers(header -> {
//               header.setBearerAuth(accessToken);
//            })
                .retrieve();
        log.info("2");
        //테스트용
//        userRespository.deleteById(userId);
        log.info("3");
    }

    //탈퇴 시 토큰도 만료돼서 다시 동의항목 처리하도록
}
