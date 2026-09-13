import api from "./axios"; export const dashboard=(period="30d")=>api.get(`/reports/dashboard?period=${period}`); export const report=name=>api.get(`/reports/${name}`);
