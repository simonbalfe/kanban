import Link from "next/link";
import { HiOutlineRectangleStack } from "react-icons/hi2";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Button from "~/components/Button";
import PatternedBackground from "~/components/PatternedBackground";
import { Tooltip } from "~/components/Tooltip";
import { useModal } from "~/providers/modal";
import { api, apiKeys } from "~/utils/api";

export function BoardsList({ isTemplate }: { isTemplate?: boolean }) {
  const { openModal } = useModal();
  const isAdminOrMember = true;

  const boardFilter = { type: isTemplate ? "template" : "regular" };
  const { data, isLoading } = useQuery({
    queryKey: apiKeys.board.all(boardFilter),
    queryFn: () => api.board.all(boardFilter),
  });

  if (isLoading)
    return (
      <div className="3xl:grid-cols-4 grid h-fit w-full grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
        <div className="mr-5 flex h-[150px] w-full animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
        <div className="mr-5 flex h-[150px] w-full animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
        <div className="mr-5 flex h-[150px] w-full animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
      </div>
    );

  if (data?.length === 0)
    return (
      <div className="z-10 flex h-full w-full flex-col items-center justify-center space-y-8 pb-[150px]">
        <div className="flex flex-col items-center">
          <HiOutlineRectangleStack className="h-10 w-10 text-light-800 dark:text-dark-800" />
          <p className="mb-2 mt-4 text-[14px] font-bold text-light-1000 dark:text-dark-950">
            {`No ${isTemplate ? "templates" : "boards"}`}
          </p>
          <p className="text-[14px] text-light-900 dark:text-dark-900">
            {`Get started by creating a new ${isTemplate ? "template" : "board"}`}
          </p>
        </div>
        <Tooltip
          content={
            !isAdminOrMember ? "You don't have permission" : undefined
          }
        >
          <Button
            onClick={() => {
              if (isAdminOrMember) openModal("NEW_BOARD");
            }}
            disabled={!isAdminOrMember}
          >
            {`Create new ${isTemplate ? "template" : "board"}`}
          </Button>
        </Tooltip>
      </div>
    );

  return (
    <motion.div
      className="3xl:grid-cols-4 grid h-fit w-full grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
      layout
    >
      {data?.map((board) => (
        <motion.div
          key={board.publicId}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            layout: {
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1
            },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 }
          }}
        >
          <Link
            href={`${isTemplate ? "templates" : "boards"}/${board.publicId}`}
          >
            <div className="group relative mr-5 flex h-[150px] w-full items-center justify-center rounded-md border border-dashed border-light-400 bg-light-50 shadow-sm hover:bg-light-200 dark:border-dark-600 dark:bg-dark-50 dark:hover:bg-dark-100">
              <PatternedBackground />
              <p className="px-4 text-[14px] font-bold text-neutral-700 dark:text-dark-1000">
                {board.name}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
