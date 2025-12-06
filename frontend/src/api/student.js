// src/api/students.js
import client from "./client";

/**
 * List students
 * optional params: { batch: "<batchId>", q: "<search>" }
 */
export const getStudents = (params) => {
  // pass params as { params: { ... } } to axios
  return client.get("/students", params ? { params } : undefined);
};

/** Get single student */
export const getStudent = (id) => client.get(`/students/${id}`);

/** Create a new student
 * body example:
 * {
 *   name: "Rahul",
 *   parentName: "Mr Kumar",
 *   phone: "9876543210",
 *   email: "a@b.com",
 *   monthlyFee: 2000,
 *   batch: "<batchId>" // optional
 * }
 */
export const createStudent = (data) => client.post("/students", data);

/** Update student (partial or full)
 * data may contain fields like { name, parentName, monthlyFee, batch, isActive, isPaid, ... }
 */
export const updateStudent = (id, data) => client.put(`/students/${id}`, data);

/** Delete student */
export const deleteStudent = (id) => client.delete(`/students/${id}`);

/**
 * Convenience: toggle active status (not necessary but handy)
 * This just calls updateStudent under the hood.
 */
export const toggleActive = (id, isActive) =>
  client.put(`/students/${id}`, { isActive });

export default {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleActive,
};

// assign a batch to many students
export const assignBatchToStudents = (data) => client.post("/students/assign-batch", data);
