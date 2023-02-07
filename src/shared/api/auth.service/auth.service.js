import axios from "axios";
import config from "../../config/config.json";
import localStorageService from "../localStorage.service";

const httpAuth = axios.create({
    baseURL: "https://identitytoolkit.googleapis.com/v1/",
    params: {
        key: config.API_WEB_KEY,
    },
});

const authService = {
    register: async ({ email, password }) => {
        const { data } = await httpAuth.post("accounts:signUp", {
            email,
            password,
            returnSecureToken: true,
        });
        return data;
    },
    login: async ({ email, password }) => {
        const { data } = await httpAuth.post("accounts:signInWithPassword", {
            email,
            password,
            returnSecureToken: true,
        });
        return data;
    },
    refresh: async () => {
        const { data } = await httpAuth.post("token", {
            grant_type: "refresh_token",
            refresh_token: localStorageService.getRefreshToken(),
        });
        return data;
    },
};

export default authService;
