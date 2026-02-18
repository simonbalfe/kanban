import { magicLink } from "better-auth/plugins/magic-link";

import type { dbClient } from "~/db/client";
import { sendEmail } from "~/lib/email";

export function createPlugins(_db: dbClient) {
  return [
    magicLink({
      expiresIn: 60 * 60 * 24 * 7,
      sendMagicLink: async ({ email, url }) => {
        await sendEmail(
          email,
          process.env.NEXT_PUBLIC_WHITE_LABEL_HIDE_POWERED_BY === "true"
            ? "Sign in to your account"
            : "Sign in to Kan",
          "MAGIC_LINK",
          {
            magicLoginUrl: url,
          },
        );
      },
    }),
  ];
}
