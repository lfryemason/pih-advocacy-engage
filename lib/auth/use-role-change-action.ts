"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RpcResult = PromiseLike<{ error: { message: string } | null }>;

// Shared by any table that lets an admin change someone's role via a
// Supabase RPC call: tracks which row is mid-request (by an opaque caller
// key), surfaces a single error message, and refreshes server data on
// success. Used by the org-wide admin user list and the per-team member
// table, which otherwise duplicated this loading/error/refresh boilerplate.
export function useRoleChangeAction() {
  const router = useRouter();
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const isPending = (key: string) => pendingKeys.has(key);

  const clearError = () => setError(null);

  const changeRole = async (
    key: string,
    call: () => RpcResult,
    describeError: (message: string) => string,
  ) => {
    setPendingKeys((previous) => new Set(previous).add(key));
    setError(null);
    try {
      const { error: rpcError } = await call();
      if (rpcError) throw new Error(rpcError.message);
      router.refresh();
    } catch (err) {
      setError(
        describeError(err instanceof Error ? err.message : "unknown error"),
      );
    } finally {
      setPendingKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    }
  };

  return { isPending, error, changeRole, clearError };
}
