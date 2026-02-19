import { Fragment } from "react";
import { HiLink } from "react-icons/hi";

import { env } from "~/env";
import { Tooltip } from "~/components/Tooltip";
import { usePopup } from "~/providers/popup";

const displayBaseUrl = env.VITE_PUBLIC_URL;

const linkBaseUrl = env.VITE_PUBLIC_URL;

const pathSeparator = (
  <div className="mx-1.5 h-4 w-px rotate-[20deg] bg-gray-300 dark:bg-dark-600" />
);

const UpdateBoardSlugButton = ({
  handleOnClick,
  boardPublicId,
  isLoading,
  canEdit,
}: {
  handleOnClick: () => void;
  boardPublicId: string;
  isLoading: boolean;
  canEdit: boolean;
}) => {
  const { showPopup } = usePopup();

  if (isLoading) {
    return (
      <div className="hidden h-[36px] w-[225px] animate-pulse rounded-full bg-light-200 dark:bg-dark-100 xl:flex" />
    );
  }

  if (!boardPublicId) return <></>;

  const boardUrl = `${linkBaseUrl}/boards/${boardPublicId}`;
  const pathSegments = [displayBaseUrl, "boards", boardPublicId];

  return (
    <Tooltip
      content={!canEdit ? "You don't have permission" : undefined}
    >
      <button
        onClick={canEdit ? handleOnClick : undefined}
        disabled={!canEdit || isLoading}
        className="hidden cursor-pointer items-center gap-2 rounded-full border-[1px] bg-light-50 p-1 pl-4 pr-1 text-sm text-light-950 hover:bg-light-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-600 dark:bg-dark-50 dark:text-dark-900 dark:hover:bg-dark-100 xl:flex"
      >
        <div className="flex items-center">
          {pathSegments.map((segment, i) => (
            <Fragment key={i}>
              {i > 0 && pathSeparator}
              <span>{segment}</span>
            </Fragment>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(boardUrl).then(
              () =>
                showPopup({
                  header: "Link copied",
                  icon: "success",
                  message: "Board URL copied to clipboard",
                }),
            ).catch(() => undefined);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-light-200 dark:hover:bg-dark-200"
          aria-label={"Copy board link"}
        >
          <HiLink className="h-[13px] w-[13px]" />
        </button>
      </button>
    </Tooltip>
  );
};

export default UpdateBoardSlugButton;
