"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { tokenStore } from "./auth-store";

export function useAuthActions() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await api.login(email, password);
      queryClient.clear();
      tokenStore.set(access_token);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  return { login, logout };
}
