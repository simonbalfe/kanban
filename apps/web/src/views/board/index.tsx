import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { DropResult } from "react-beautiful-dnd";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { useForm } from "react-hook-form";
import {
  HiOutlinePlusSmall,
  HiOutlineRectangleStack,
  HiOutlineSquare3Stack3D,
} from "react-icons/hi2";

interface UpdateBoardInput {
  boardPublicId: string;
  name: string;
}

import Button from "~/components/Button";
import { DeleteLabelConfirmation } from "~/components/DeleteLabelConfirmation";
import { LabelForm } from "~/components/LabelForm";
import Modal from "~/components/modal";
import { PageHead } from "~/components/PageHead";
import PatternedBackground from "~/components/PatternedBackground";
import { StrictModeDroppable as Droppable } from "~/components/StrictModeDroppable";
import { Tooltip } from "~/components/Tooltip";
import { useDragToScroll } from "~/hooks/useDragToScroll";
import { useModal } from "~/providers/modal";
import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { formatToArray } from "~/utils/helpers";
import BoardDropdown from "./components/BoardDropdown";
import Card from "./components/Card";
import { DeleteBoardConfirmation } from "./components/DeleteBoardConfirmation";
import { DeleteListConfirmation } from "./components/DeleteListConfirmation";
import Filters from "./components/Filters";
import List from "./components/List";
import { NewCardForm } from "./components/NewCardForm";
import { NewListForm } from "./components/NewListForm";
import { NewTemplateForm } from "./components/NewTemplateForm";
import UpdateBoardSlugButton from "./components/UpdateBoardSlugButton";
import { UpdateBoardSlugForm } from "./components/UpdateBoardSlugForm";

type PublicListId = string;

export default function BoardPage({ isTemplate }: { isTemplate?: boolean }) {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false }) as Record<string, any>;
  const _navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();
  const { openModal, modalContentType, entityId, isOpen } = useModal();
  const [selectedPublicListId, setSelectedPublicListId] =
    useState<PublicListId>("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { ref: scrollRef, onMouseDown } = useDragToScroll({
    enabled: true,
    direction: "horizontal",
  });

  const isAdminOrMember = true;

  const boardId = (params as any).boardId ?? null;

  const updateBoard = useMutation({
    mutationFn: api.board.update,
  });

  const { register, handleSubmit, setValue } = useForm<UpdateBoardInput>({
    values: {
      boardPublicId: boardId ?? "",
      name: "",
    },
  });

  const onSubmit = (values: UpdateBoardInput) => {
    updateBoard.mutate({
      boardPublicId: values.boardPublicId,
      name: values.name,
    });
  };

  const semanticFilters = formatToArray(search.dueDate) as (
    | "overdue"
    | "today"
    | "tomorrow"
    | "next-week"
    | "next-month"
    | "no-due-date"
  )[];

  const boardType: "regular" | "template" = isTemplate ? "template" : "regular";

  const queryParams = {
    boardPublicId: boardId ?? "",
    members: formatToArray(search.members),
    labels: formatToArray(search.labels),
    lists: formatToArray(search.lists),
    ...(semanticFilters.length > 0 && {
      dueDateFilters: semanticFilters,
    }),
    type: boardType,
  };

  const boardByIdQueryKey = apiKeys.board.byId(queryParams);

  const {
    data: boardData,
    isSuccess,
    isLoading: isQueryLoading,
  } = useQuery({
    queryKey: boardByIdQueryKey,
    queryFn: () => api.board.byId(queryParams),
    enabled: !!boardId,
    placeholderData: keepPreviousData,
  });

  const refetchBoard = async () => {
    if (boardId) {
      await queryClient.refetchQueries({
        queryKey: apiKeys.board.byId({ boardPublicId: boardId }),
      });
    }
  };

  useEffect(() => {
    if (boardId) {
      setIsInitialLoading(false);
    }
  }, [boardId]);

  const isLoading = isInitialLoading || isQueryLoading;

  const updateListMutation = useMutation({
    mutationFn: api.list.update,
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: boardByIdQueryKey });

      const currentState = queryClient.getQueryData(boardByIdQueryKey);

      queryClient.setQueryData(boardByIdQueryKey, (oldBoard: any) => {
        if (!oldBoard) return oldBoard;

        const updatedLists = Array.from(oldBoard.lists) as any[];

        const currentIndex = updatedLists.findIndex(
          (list: any) => list.publicId === args.listPublicId,
        );

        if (currentIndex === -1) return oldBoard;

        const removedList = updatedLists.splice(currentIndex, 1)[0];

        if (removedList && args.index !== undefined) {
          updatedLists.splice(args.index, 0, removedList);

          return {
            ...oldBoard,
            lists: updatedLists,
          };
        }
      });

      return { previousState: currentState };
    },
    onError: (_error, _newList, context) => {
      queryClient.setQueryData(boardByIdQueryKey, context?.previousState);
      showPopup({
        header: "Unable to update list",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: boardByIdQueryKey });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: api.card.update,
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: boardByIdQueryKey });

      const currentState = queryClient.getQueryData(boardByIdQueryKey);

      queryClient.setQueryData(boardByIdQueryKey, (oldBoard: any) => {
        if (!oldBoard) return oldBoard;

        const updatedLists = Array.from(oldBoard.lists) as any[];

        const sourceList = updatedLists.find((list: any) =>
          list.cards.some((card: any) => card.publicId === args.cardPublicId),
        );
        const destinationList = updatedLists.find(
          (list: any) => list.publicId === args.listPublicId,
        );

        const cardIndex = sourceList?.cards.findIndex(
          (card: any) => card.publicId === args.cardPublicId,
        );

        if (cardIndex === undefined || cardIndex === -1) return oldBoard;

        const removedCard = sourceList?.cards.splice(cardIndex, 1)[0];

        if (
          sourceList &&
          destinationList &&
          removedCard &&
          args.index !== undefined
        ) {
          destinationList.cards.splice(args.index, 0, removedCard);

          return {
            ...oldBoard,
            lists: updatedLists,
          };
        }
      });

      return { previousState: currentState };
    },
    onError: (_error, _newList, context) => {
      queryClient.setQueryData(boardByIdQueryKey, context?.previousState);
      showPopup({
        header: "Unable to update card",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: boardByIdQueryKey });
    },
  });

  useEffect(() => {
    if (isSuccess && boardData) {
      setValue("name", boardData.name || "");
    }
  }, [isSuccess, boardData, setValue]);

  const openNewListForm = (publicBoardId: string) => {
    openModal("NEW_LIST");
    setSelectedPublicListId(publicBoardId);
  };

  const onDragEnd = ({
    source: _source,
    destination,
    draggableId,
    type,
  }: DropResult): void => {
    if (!destination) {
      return;
    }

    if (type === "LIST" && isAdminOrMember) {
      updateListMutation.mutate({
        listPublicId: draggableId,
        index: destination.index,
      });
    }

    if (type === "CARD" && isAdminOrMember) {
      updateCardMutation.mutate({
        cardPublicId: draggableId,

        listPublicId: destination.droppableId,
        index: destination.index,
      });
    }
  };

  const renderModalContent = () => {
    return (
      <>
        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "DELETE_BOARD"}
        >
          <DeleteBoardConfirmation
            isTemplate={!!isTemplate}
            boardPublicId={boardId ?? ""}
          />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "DELETE_LIST"}
        >
          <DeleteListConfirmation
            listPublicId={selectedPublicListId}
            queryParams={queryParams}
          />
        </Modal>

        <Modal
          modalSize="md"
          isVisible={isOpen && modalContentType === "NEW_CARD"}
        >
          <NewCardForm
            isTemplate={!!isTemplate}
            boardPublicId={boardId ?? ""}
            listPublicId={selectedPublicListId}
            queryParams={queryParams}
          />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "NEW_LIST"}
        >
          <NewListForm
            boardPublicId={boardId ?? ""}
            queryParams={queryParams}
          />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "NEW_LABEL"}
        >
          <LabelForm boardPublicId={boardId ?? ""} refetch={refetchBoard} />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "EDIT_LABEL"}
        >
          <LabelForm
            boardPublicId={boardId ?? ""}
            refetch={refetchBoard}
            isEdit
          />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "DELETE_LABEL"}
        >
          <DeleteLabelConfirmation
            refetch={refetchBoard}
            labelPublicId={entityId}
          />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "UPDATE_BOARD_SLUG"}
        >
          <UpdateBoardSlugForm
            boardPublicId={boardId ?? ""}
            boardSlug={boardData?.slug ?? ""}
            queryParams={queryParams}
          />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "CREATE_TEMPLATE"}
        >
          <NewTemplateForm
            sourceBoardPublicId={boardId ?? ""}
            sourceBoardName={boardData?.name ?? ""}
          />
        </Modal>
      </>
    );
  };

  return (
    <>
      <PageHead
        title={`${boardData?.name ?? (isTemplate ? "Board" : "Template")}`}
      />
      <div className="relative flex h-full flex-col">
        <PatternedBackground />
        <div className="z-10 flex w-full flex-col justify-between p-6 md:flex-row md:p-8">
          {isLoading && !boardData && (
            <div className="flex space-x-2">
              <div className="h-[2.3rem] w-[150px] animate-pulse rounded-[5px] bg-light-200 dark:bg-dark-100" />
            </div>
          )}
          {boardData && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="order-2 focus-visible:outline-none md:order-1"
            >
              <input
                id="name"
                type="text"
                {...register("name")}
                onBlur={isAdminOrMember ? handleSubmit(onSubmit) : undefined}
                readOnly={!isAdminOrMember}
                className="block border-0 bg-transparent p-0 py-0 font-bold leading-[2.3rem] tracking-tight text-neutral-900 focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed dark:text-dark-1000 sm:text-[1.2rem]"
              />
            </form>
          )}
          {!boardData && !isLoading && (
            <p className="order-2 block p-0 py-0 font-bold leading-[2.3rem] tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem] md:order-1">
              {`${isTemplate ? "Template" : "Board"} not found`}
            </p>
          )}
          <div className="order-1 mb-4 flex items-center justify-end space-x-2 md:order-2 md:mb-0">
            {isTemplate && (
              <div className="inline-flex cursor-default items-center justify-center whitespace-nowrap rounded-md border-[1px] border-light-300 bg-light-50 px-3 py-2 text-sm font-semibold text-light-950 shadow-sm dark:border-dark-300 dark:bg-dark-50 dark:text-dark-950">
                <span className="mr-2">
                  <HiOutlineRectangleStack />
                </span>
                {"Template"}
              </div>
            )}
            {!isTemplate && (
              <>
                <UpdateBoardSlugButton
                  handleOnClick={() => openModal("UPDATE_BOARD_SLUG")}
                  isLoading={isLoading}
                  boardPublicId={boardId ?? ""}
                  canEdit={isAdminOrMember}
                />
                {boardData && (
                  <Filters
                    labels={boardData.labels}
                    members={[]}
                    lists={boardData.allLists}
                    position="left"
                    isLoading={!boardData}
                  />
                )}
              </>
            )}
            <Tooltip
              content={
                !isAdminOrMember
                  ? "You don't have permission"
                  : "Create new list"
              }
            >
              <Button
                iconLeft={
                  <HiOutlinePlusSmall
                    className="-mr-0.5 h-5 w-5"
                    aria-hidden="true"
                  />
                }
                onClick={() => {
                  if (boardId && isAdminOrMember) openNewListForm(boardId);
                }}
                disabled={!boardData || !isAdminOrMember}
              >
                {"New list"}
              </Button>
            </Tooltip>
            <BoardDropdown isTemplate={!!isTemplate} isLoading={!boardData} />
          </div>
        </div>

        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          className={`scrollbar-w-none scrollbar-track-rounded-[4px] scrollbar-thumb-rounded-[4px] scrollbar-h-[8px] z-0 flex-1 overflow-y-hidden overflow-x-scroll overscroll-contain scrollbar scrollbar-track-light-200 scrollbar-thumb-light-400 dark:scrollbar-track-dark-100 dark:scrollbar-thumb-dark-300`}
        >
          {isLoading ? (
            <div className="ml-[2rem] flex">
              <div className="0 mr-5 h-[500px] w-[18rem] animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
              <div className="0 mr-5 h-[275px] w-[18rem] animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
              <div className="0 mr-5 h-[375px] w-[18rem] animate-pulse rounded-md bg-light-200 dark:bg-dark-100" />
            </div>
          ) : boardData ? (
            boardData.lists.length === 0 ? (
              <div className="z-10 flex h-full w-full flex-col items-center justify-center space-y-8 pb-[150px]">
                <div className="flex flex-col items-center">
                  <HiOutlineSquare3Stack3D className="h-10 w-10 text-light-800 dark:text-dark-800" />
                  <p className="mb-2 mt-4 text-[14px] font-bold text-light-1000 dark:text-dark-950">
                    {"No lists"}
                  </p>
                  <p className="text-[14px] text-light-900 dark:text-dark-900">
                    {isAdminOrMember
                      ? "Get started by creating a new list"
                      : "No lists have been created yet"}
                  </p>
                </div>
                <Tooltip
                  content={
                    !isAdminOrMember ? "You don't have permission" : undefined
                  }
                >
                  <Button
                    onClick={() => {
                      if (boardId && isAdminOrMember) openNewListForm(boardId);
                    }}
                    disabled={!isAdminOrMember}
                  >
                    {"Create new list"}
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable
                  droppableId="all-lists"
                  direction="horizontal"
                  type="LIST"
                >
                  {(provided) => (
                    <div
                      className="flex"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div className="min-w-[2rem]" />
                      {boardData.lists.map((list, index) => (
                        <List
                          index={index}
                          key={list.publicId}
                          list={list}
                          setSelectedPublicListId={(publicListId) =>
                            setSelectedPublicListId(publicListId)
                          }
                        >
                          <Droppable
                            droppableId={`${list.publicId}`}
                            type="CARD"
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="scrollbar-track-rounded-[4px] scrollbar-thumb-rounded-[4px] scrollbar-w-[8px] z-10 h-full max-h-[calc(100vh-225px)] min-h-[2rem] overflow-y-auto pr-1 scrollbar dark:scrollbar-track-dark-100 dark:scrollbar-thumb-dark-600"
                              >
                                {list.cards.map((card, index) => (
                                  <Draggable
                                    key={card.publicId}
                                    draggableId={card.publicId}
                                    index={index}
                                    isDragDisabled={!isAdminOrMember}
                                  >
                                    {(provided) => (
                                      <Link
                                        onClick={(e) => {
                                          if (
                                            card.publicId.startsWith(
                                              "PLACEHOLDER",
                                            )
                                          )
                                            e.preventDefault();
                                        }}
                                        key={card.publicId}
                                        to={
                                          (isTemplate
                                            ? `/templates/${boardId}/cards/${card.publicId}`
                                            : `/cards/${card.publicId}`) as string
                                        }
                                        className={`mb-2 flex !cursor-pointer flex-col ${
                                          card.publicId.startsWith(
                                            "PLACEHOLDER",
                                          )
                                            ? "pointer-events-none"
                                            : ""
                                        }`}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <Card
                                          title={card.title}
                                          labels={card.labels}
                                          members={[]}
                                          checklists={card.checklists ?? []}
                                          description={card.description ?? null}
                                          dueDate={card.dueDate ?? null}
                                        />
                                      </Link>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </List>
                      ))}
                      <div className="min-w-[0.75rem]" />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )
          ) : null}
        </div>
        {renderModalContent()}
      </div>
    </>
  );
}
