import client from "./client";

export const login = (className, password) =>
  client.post("/auth/login", { className, password });

export const registerStudio = (className, email, password, phone) =>
  client.post("/auth/register", { className, email, password, phone });
