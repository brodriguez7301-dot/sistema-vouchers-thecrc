import { api } from "./api";
import type { User } from "./types";

export function saveToken(token: string) {
  localStorage.setItem("voucher_token", token);
}

export function clearToken() {
  localStorage.removeItem("voucher_token");
  localStorage.removeItem("voucher_user");
}

export function saveUser(user: User) {
  localStorage.setItem("voucher_user", JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("voucher_user");
  return raw ? JSON.parse(raw) : null;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api.login(email, password);
  saveToken(res.access_token);
  saveUser(res.user);
  return res.user;
}

export function logout() {
  clearToken();
  window.location.href = "/login";
}
