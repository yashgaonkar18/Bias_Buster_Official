import { api } from "./api";

// Signup
export const signup = async (data: {
  full_name: string;
  email: string;
  password: string;
}) => {
  const res = await api.post("/api/auth/signup", data);
  return res.data;
};

// Login
export const login = async (data: {
  email: string;
  password: string;
}) => {
  const res = await api.post("/api/auth/login", data);
  return res.data;
};

// Refresh Token
export const refreshToken = async (refresh_token: string) => {
  const res = await api.post("/api/auth/refresh", {
    refresh_token,
  });

  return res.data;
};

// Logout
export const logout = async (refresh_token: string) => {
  const res = await api.post("/api/auth/logout", {
    refresh_token,
  });

  return res.data;
};

// Logout All Devices
export const logoutAll = async (token: string) => {
  const res = await api.post(
    "/api/auth/logout-all",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

// Current User
export const getMe = async (token: string) => {
  const res = await api.get("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// Forgot Password
export const forgotPassword = async (email: string) => {
  const res = await api.post("/api/auth/forgot-password", {
    email,
  });

  return res.data;
};

// Reset Password
export const resetPassword = async (
  token: string,
  new_password: string
) => {
  const res = await api.post("/api/auth/reset-password", {
    token,
    new_password,
  });

  return res.data;
};

// Verify Email
export const verifyEmail = async (token: string) => {
  const res = await api.post("/api/auth/verify-email", {
    token,
  });

  return res.data;
};

// Resend Verification
export const resendVerification = async (email: string) => {
  const res = await api.post("/api/auth/resend-verification", {
    email,
  });

  return res.data;
};

// Google Login
export const googleLogin = () => {
  window.location.href =
    "http://localhost:8000/api/auth/google/login";
};

// GitHub Login
export const githubLogin = () => {
  window.location.href =
    "http://localhost:8000/api/auth/github/login";
};