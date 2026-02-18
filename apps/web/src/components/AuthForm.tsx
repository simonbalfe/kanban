import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { env } from "next-runtime-env";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FaGoogle } from "react-icons/fa";
import { z } from "zod";

import { authClient } from "@kan/auth/client";

import Button from "~/components/Button";
import Input from "~/components/Input";
import { usePopup } from "~/providers/popup";

interface FormValues {
  name?: string;
  email: string;
  password?: string;
}

interface AuthProps {
  setIsMagicLinkSent: (value: boolean, recipient: string) => void;
  isSignUp?: boolean;
}

const EmailSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().optional(),
});

export function Auth({ setIsMagicLinkSent, isSignUp }: AuthProps) {
  const [isGoogleLoginPending, setIsGoogleLoginPending] = useState(false);
  const [isCredentialsEnabled, setIsCredentialsEnabled] = useState(false);
  const [isEmailSendingEnabled, setIsEmailSendingEnabled] = useState(false);
  const [isLoginWithEmailPending, setIsLoginWithEmailPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { showPopup } = usePopup();
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const redirect = useSearchParams().get("next");
  const callbackURL = redirect ?? "/boards";

  useEffect(() => {
    const credentialsAllowed =
      env("NEXT_PUBLIC_ALLOW_CREDENTIALS")?.toLowerCase() === "true";
    const emailSendingEnabled =
      env("NEXT_PUBLIC_DISABLE_EMAIL")?.toLowerCase() !== "true";
    setIsEmailSendingEnabled(emailSendingEnabled);
    setIsCredentialsEnabled(credentialsAllowed);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(EmailSchema),
  });

  const handleLoginWithEmail = async (
    email: string,
    password?: string | null,
    name?: string,
  ) => {
    setIsLoginWithEmailPending(true);
    setLoginError(null);
    if (password) {
      if (isSignUp && name) {
        await authClient.signUp.email(
          {
            name,
            email,
            password,
            callbackURL,
          },
          {
            onSuccess: () =>
              showPopup({
                header: t`Success`,
                message: t`You have been signed up successfully.`,
                icon: "success",
              }),
            onError: ({ error }) => setLoginError(error.message),
          },
        );
      } else {
        await authClient.signIn.email(
          {
            email,
            password,
            callbackURL,
          },
          {
            onSuccess: () =>
              showPopup({
                header: t`Success`,
                message: t`You have been logged in successfully.`,
                icon: "success",
              }),
            onError: ({ error }) => setLoginError(error.message),
          },
        );
      }
    } else {
      if (isEmailSendingEnabled && !isSignUp) {
        await authClient.signIn.magicLink(
          {
            email,
            callbackURL,
          },
          {
            onSuccess: () => setIsMagicLinkSent(true, email),
            onError: ({ error }) => setLoginError(error.message),
          },
        );
      } else {
        setLoginError(
          isSignUp
            ? t`Password is required to sign up.`
            : t`Password is required to login.`,
        );
      }
    }

    setIsLoginWithEmailPending(false);
  };

  const handleLoginWithGoogle = async () => {
    setIsGoogleLoginPending(true);
    setLoginError(null);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    setIsGoogleLoginPending(false);

    if (result.error) {
      setLoginError(t`Failed to login with Google. Please try again.`);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const sanitizedPassword = values.password?.trim()
      ? values.password
      : undefined;
    await handleLoginWithEmail(values.email, sanitizedPassword, values.name);
  };

  const password = watch("password");

  const isMagicLinkAvailable = useMemo(() => {
    return isEmailSendingEnabled && !isSignUp;
  }, [isEmailSendingEnabled, isSignUp]);

  const isMagicLinkMode = useMemo(() => {
    if (!isEmailSendingEnabled || isSignUp) return false;
    if (!isCredentialsEnabled) return true;
    return !password;
  }, [isEmailSendingEnabled, isSignUp, isCredentialsEnabled, password]);

  useEffect(() => {
    if (!isCredentialsEnabled) return;
    const pwdEmpty = (password ?? "").length === 0;
    let needsPassword = false;
    if (isSignUp && pwdEmpty) {
      needsPassword = true;
    } else if (loginError?.toLowerCase().includes("password")) {
      needsPassword = true;
    } else if (errors.password) {
      needsPassword = true;
    }
    if (needsPassword && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [isSignUp, password, loginError, errors.password, isCredentialsEnabled]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          onClick={handleLoginWithGoogle}
          isLoading={isGoogleLoginPending}
          iconLeft={<FaGoogle />}
          fullWidth
          size="lg"
        >
          <Trans>Continue with Google</Trans>
        </Button>
      </div>
      {(isCredentialsEnabled || isMagicLinkAvailable) && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-[1.5rem] flex w-full items-center gap-4">
            <div className="h-[1px] w-full bg-light-600 dark:bg-dark-600" />
            <span className="text-sm text-light-900 dark:text-dark-900">
              {t`or`}
            </span>
            <div className="h-[1px] w-full bg-light-600 dark:bg-dark-600" />
          </div>
          <div className="space-y-2">
            {isSignUp && isCredentialsEnabled && (
              <div>
                <Input
                  {...register("name", { required: true })}
                  placeholder={t`Enter your name`}
                />
                {errors.name && (
                  <p className="mt-2 text-xs text-red-400">
                    {t`Please enter a valid name`}
                  </p>
                )}
              </div>
            )}
            <div>
              <Input
                {...register("email", { required: true })}
                placeholder={t`Enter your email address`}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-red-400">
                  {t`Please enter a valid email address`}
                </p>
              )}
            </div>

            {isCredentialsEnabled && (
              <div>
                <Input
                  type="password"
                  {...register("password", { required: true })}
                  placeholder={t`Enter your password`}
                />
                {errors.password && (
                  <p className="mt-2 text-xs text-red-400">
                    {errors.password.message ??
                      t`Please enter a valid password`}
                  </p>
                )}
              </div>
            )}
            {loginError && (
              <p className="mt-2 text-xs text-red-400">{loginError}</p>
            )}
          </div>
          <div className="mt-[1.5rem] flex items-center gap-4">
            <Button
              isLoading={isLoginWithEmailPending}
              fullWidth
              size="lg"
              variant="secondary"
            >
              {isSignUp ? t`Sign up with ` : t`Continue with `}
              {isMagicLinkMode ? t`magic link` : t`email`}
            </Button>
          </div>
        </form>
      )}
      {!(isCredentialsEnabled || isMagicLinkAvailable) && loginError && (
        <p className="mt-2 text-xs text-red-400">{loginError}</p>
      )}
    </div>
  );
}
