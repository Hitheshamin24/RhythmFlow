import client from "./client";

export const getBatches = () => client.get("/batches");

export const createBatch = (data) => client.post("/batches", data);

export const updateBatch = (id, data) => client.put(`/batches/${id}`, data);

export const deleteBatch = (id) => client.delete(`/batches/${id}`);
