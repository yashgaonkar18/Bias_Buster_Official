// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: false,
});

// Add JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);