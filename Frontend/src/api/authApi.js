import api from "./axios"; export const login=(body)=>api.post("/auth/login",body); export const register=(body)=>api.post("/auth/register",body); export const me=()=>api.get("/auth/me");
