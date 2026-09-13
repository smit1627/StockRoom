import axios from "axios";

// In development Vite proxies this relative path to the API. This means phones
// and other LAN devices use the same host they opened in the browser, rather
// than a stale IP address compiled into the frontend.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("inventory_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("inventory_access_token");
            window.dispatchEvent(new Event("auth:expired"));
        }
        return Promise.reject(error);
    },
);

export default api;
