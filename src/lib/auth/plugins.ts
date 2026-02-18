import { magicLink } from "better-auth/plugins/magic-link";

import type { dbClient } from "~/db/client";
import * as memberRepo from "~/db/repository/member.repo";
import * as userRepo from "~/db/repository/user.repo";
import * as workspaceRepo from "~/db/repository/workspace.repo";
import { sendEmail } from "~/lib/email";

export function createPlugins(db: dbClient) {
  return [
    magicLink({
      expiresIn: 60 * 60 * 24 * 7,
      sendMagicLink: async ({ email, url }) => {
        const decodedUrl = decodeURIComponent(url);
        console.log("Sending magic link to:", email, "URL:", url);
        console.log(
          "Magic link contains invite:",
          decodedUrl.includes("type=invite"),
        );
        if (decodedUrl.includes("type=invite")) {
          let inviterName = "";
          let workspaceName = "";

          try {
            const urlObj = new URL(url);
            const callbackUrl = urlObj.searchParams.get("callbackURL");
            if (callbackUrl) {
              const callbackParams = new URL(
                callbackUrl,
                process.env.NEXT_PUBLIC_BASE_URL,
              ).searchParams;
              const memberPublicId = callbackParams.get("memberPublicId");

              if (memberPublicId) {
                const member = await memberRepo.getByPublicId(
                  db,
                  memberPublicId,
                );
                if (member) {
                  const [workspace, inviter] = await Promise.all([
                    workspaceRepo.getById(db, member.workspaceId),
                    userRepo.getById(db, member.createdBy),
                  ]);

                  if (workspace) workspaceName = workspace.name;
                  if (inviter) inviterName = inviter.name ?? "";
                }
              }
            }
          } catch (error) {
            console.error("Failed to fetch invite details:", error);
          }

          await sendEmail(
            email,
            workspaceName
              ? `Invitation to join the workspace ${workspaceName}`
              : "Invitation to join workspace",
            "JOIN_WORKSPACE",
            {
              magicLoginUrl: url,
              inviterName,
              workspaceName,
            },
          );
        } else {
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
        }
      },
    }),
  ];
}
