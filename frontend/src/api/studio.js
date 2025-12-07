// src/api/studio.js
import client from "./client";

export const getStudioProfile = () => client.get("/studio/me");

export const updateStudioProfile = (payload) =>
  client.put("/studio/me", payload);
// payload can be { email, phone, className }

export const changeStudioPassword = (currentPassword, newPassword) =>
  client.post("/studio/change-password", { currentPassword, newPassword });
