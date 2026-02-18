import { getAvatarUrl } from "~/utils/helpers";

export default function Avatar({
  userImage,
}: {
  userId: string | undefined;
  userImage: string | null | undefined;
}) {
  const avatarUrl = userImage ? getAvatarUrl(userImage) : undefined;

  return (
    <div>
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <span className="inline-block h-16 w-16 overflow-hidden rounded-full bg-light-400 dark:bg-dark-400">
            <svg
              className="h-full w-full text-dark-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
