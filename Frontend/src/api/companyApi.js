import api from "./axios";export const getCompany=()=>api.get("/company");export const saveCompany=body=>api.put("/company",body,{headers:{"Content-Type":"multipart/form-data"}});
