import axios from "axios";
import { API_URL } from "@nucleo/config";

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (t: string | null) => {
  token = t;
};
export const setOnUnauthorized = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export const api = axios.create({ baseURL: API_URL, timeout: 10_000 });

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) onUnauthorized?.();
    return Promise.reject(error);
  }
);
