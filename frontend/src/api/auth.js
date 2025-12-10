import client from "./client";

export const login = (className, password) =>
  client.post("/auth/login", { className, password });

export const registerStudio = (className, email, password, phone) =>
  client.post("/auth/register", { className, email, password, phone });

export const requestPasswordOtp = ({ className, email, phone }) =>
  client.post("/auth/forgot-password", {
    className: className || undefined,
    email: email || undefined,
    phone: phone || undefined,
  });

// Reset password with OTP
export const resetPasswordWithOtp = ({
  className,
  email,
  phone,
  otp,
  newPassword,
}) =>
  client.post("/auth/reset-password-otp", {
    className: className || undefined,
    email: email || undefined,
    phone: phone || undefined,
    otp,
    newPassword,
  });

  export const verifyEmailOtp = ({ className, email, otp }) =>
  client.post("/auth/verify-email", {
    className: className || undefined,
    email: email || undefined,
    otp,
  });
