import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useAdminAuth() {
  const { data, isLoading, refetch } = trpc.adminAuth.verify.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const login = useCallback(
    async (password: string) => {
      return loginMutation.mutateAsync({ password });
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    login,
    logout,
    loginError: loginMutation.error?.message,
    isLoggingIn: loginMutation.isPending,
  };
}
