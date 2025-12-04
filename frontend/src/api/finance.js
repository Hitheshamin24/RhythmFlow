import client from "./client";
export const getFinanceSummary = () => client.get("/finance/summary");
export const getMonthlyFinance = (months = 6) => client.get(`/finance/monthly?months=${months}`);
export const addExpense = (data) => client.post("/finance/expense", data);
export const deleteExpense = (id) => client.delete(`/finance/expense/${id}`);
