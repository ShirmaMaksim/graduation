import axios from "axios";
import configJSON from "../../config/config.json";
import localStorageService from "../localStorage.service";
import authService from "../auth.service";

const http = axios.create({
    baseURL: configJSON.API_BASE_URL,
});

http.interceptors.request.use(
    async function (config) {
        const expiresDate = localStorageService.getExpiresDate();
        const refreshToken = localStorageService.getRefreshToken();
        const isExpired = refreshToken && expiresDate < Date.now();

        if (configJSON.isFireBase) {
            const isContainSlash = /\/$/gi.test(config.url);
            config.url = (isContainSlash ? config.url.slice(0, -1) : config.url) + ".json";
            if (isExpired) {
                const data = await authService.refresh();
                localStorageService.setTokens({
                    refreshToken: data.refresh_token,
                    idToken: data.id_token,
                    expiresIn: data.expires_in,
                    localId: data.user_id,
                });
            }
            const accesToken = localStorageService.getAccessToken();
            if (accesToken) {
                config.params = {
                    ...config.params,
                    auth: accesToken,
                };
            }
        } else {
            if (isExpired) {
                const data = await authService.refresh();
                localStorageService.setTokens(data);
            }
            const accesToken = localStorageService.getAccessToken();
            if (accesToken) {
                config.headers = {
                    ...config.params,
                    Authorization: `Bearer ${accesToken}`,
                };
                config.params = {
                    orderBy: config.orderBy,
                    equalTo: config.equalTo,
                };
            }
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

const transformData = (data) => {
    return data && !data._id ? Object.keys(data).map((key) => ({ ...data[key] })) : data;
};

http.interceptors.response.use(
    (response) => {
        if (configJSON.isFireBase) {
            response.data = transformData(response.data);
        }
        return response;
    },
    function (error) {
        const expectedErrors = error.response && error.response.status >= 400 && error.response.status < 500;
        if (!expectedErrors) {
            console.log(error, "Somthing was wrong. Try it later...");
        }
        return Promise.reject(error);
    }
);

const httpService = {
    get: http.get,
    post: http.post,
    patch: http.patch,
    delete: http.delete,
};

export default httpService;
