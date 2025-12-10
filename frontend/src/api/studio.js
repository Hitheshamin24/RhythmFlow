import client from "./client";

export const getStudioProfile = () => client.get("/studio/me");
export const updateStudioProfile = (data) => client.put("/studio/me", data);
export const changeStudioPassword = (currentPassword, newPassword) =>
  client.post("/studio/change-password", { currentPassword, newPassword });

export const verifyProfileOtp = (otp) =>
  client.post("/studio/verify-profile-otp", { otp });
