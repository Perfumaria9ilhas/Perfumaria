"use client";
import { createContext, useContext } from "react";
type Access = { name: string; role: "ADMIN" | "SUPERADMIN" } | null;
const Context = createContext<Access>(null);
export function AdminAccess({ value, children }: { value: Access; children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useAdminAccess = () => useContext(Context);
