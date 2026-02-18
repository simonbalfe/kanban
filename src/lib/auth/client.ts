import { useMemo } from "react";

const DEV_USER = {
  id: "local-dev-user",
  name: "Local User",
  email: "local@kan.dev",
  image: null as string | null,
};

type AuthError = { message: string } | null;
type AuthResult = { data: Record<string, never>; error: AuthError };

const successResult = (): AuthResult => ({ data: {}, error: null });

export const authClient = {
  useSession: () => {
    return useMemo(
      () => ({
        data: { user: DEV_USER },
        isPending: false,
        error: null,
      }),
      [],
    );
  },
  signOut: async () => successResult(),
  deleteUser: async () => successResult(),
  changePassword: async (_input: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions: boolean;
  }) => successResult(),
  signIn: {
    email: async (
      _input: { email: string; password: string; callbackURL?: string },
      options?: {
        onSuccess?: () => void;
        onError?: (args: { error: { message: string } }) => void;
      },
    ) => {
      options?.onSuccess?.();
      return successResult();
    },
    magicLink: async (
      _input: { email: string; callbackURL?: string },
      options?: {
        onSuccess?: () => void;
        onError?: (args: { error: { message: string } }) => void;
      },
    ) => {
      options?.onSuccess?.();
      return successResult();
    },
    social: async (_input: { provider: string; callbackURL?: string }) =>
      successResult(),
  },
  signUp: {
    email: async (
      _input: {
        name: string;
        email: string;
        password: string;
        callbackURL?: string;
      },
      options?: {
        onSuccess?: () => void;
        onError?: (args: { error: { message: string } }) => void;
      },
    ) => {
      options?.onSuccess?.();
      return successResult();
    },
  },
};
