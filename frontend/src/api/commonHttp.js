import axios from "axios";
import { useEffect } from "react";
import store from "../store.js"; //

const http = axios.create({
  baseURL: process.env.REACT_APP_HTTP_URL + "/api/",
});

const Interceptor = ({ children }) => {
  useEffect(() => {
    http.interceptors.request.use(
      function (config) {
        config.headers.Authorization = `Bearer ${store.getState().user.accessToken}`;
        return config;
      },
      function (err) {
        return Promise.reject(err);
      }
    );
    http.interceptors.response.use(
      (response) => {
        return response;
      },
      (err) => {
        alert(err);
        return Promise.reject(err);
      }
    );
  }, []);
  return children;
};

export { Interceptor };
export default http;
