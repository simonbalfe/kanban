import { HiOutlinePlusSmall } from "react-icons/hi2";

import Button from "~/components/Button";
import Modal from "~/components/modal";
import { PageHead } from "~/components/PageHead";
import { Tooltip } from "~/components/Tooltip";
import { useModal } from "~/providers/modal";
import { BoardsList } from "./components/BoardsList";
import { NewBoardForm } from "./components/NewBoardForm";

export default function BoardsPage({ isTemplate }: { isTemplate?: boolean }) {
  const { openModal, modalContentType, isOpen } = useModal();
  const isAdminOrMember = true;

  return (
    <>
      <PageHead title={isTemplate ? "Templates" : "Boards"} />
      <div className="m-auto h-full max-w-[1100px] p-6 px-5 md:px-28 md:py-12">
        <div className="relative z-10 mb-8 flex w-full items-center justify-between">
          <h1 className="font-bold tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem]">
            {isTemplate ? "Templates" : "Boards"}
          </h1>
          <div className="flex gap-2">
            <Tooltip
              content={
                !isAdminOrMember
                  ? "You don't have permission"
                  : `Create new ${isTemplate ? "template" : "board"}`
              }
            >
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (isAdminOrMember) openModal("NEW_BOARD");
                }}
                disabled={!isAdminOrMember}
                iconLeft={
                  <HiOutlinePlusSmall aria-hidden="true" className="h-4 w-4" />
                }
              >
                {"New"}
              </Button>
            </Tooltip>
          </div>
        </div>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "NEW_BOARD"}
        >
          <NewBoardForm isTemplate={!!isTemplate} />
        </Modal>

        <div className="flex h-full flex-row">
          <BoardsList isTemplate={!!isTemplate} />
        </div>
      </div>
    </>
  );
}
