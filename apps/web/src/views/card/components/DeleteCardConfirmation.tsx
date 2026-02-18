import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Button from "~/components/Button";
import { useModal } from "~/providers/modal";
import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";

interface DeleteCardConfirmationProps {
  cardPublicId: string;
  boardPublicId: string;
}

export function DeleteCardConfirmation({
  cardPublicId,
  boardPublicId,
}: DeleteCardConfirmationProps) {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showPopup } = usePopup();

  const boardQueryKey = apiKeys.board.byId({ boardPublicId });

  const deleteCardMutation = useMutation({
    mutationFn: api.card.delete,
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: boardQueryKey });
      const currentState = queryClient.getQueryData(boardQueryKey);

      queryClient.setQueryData(boardQueryKey, (oldBoard: any) => {
        if (!oldBoard) return oldBoard;

        const updatedLists = oldBoard.lists.map((list: any) => {
          const updatedCards = list.cards.filter(
            (card: any) => card.publicId !== args.cardPublicId,
          );
          return { ...list, cards: updatedCards };
        });

        return { ...oldBoard, lists: updatedLists };
      });

      return { previousState: currentState };
    },
    onError: (_error: any, _newList: any, context: any) => {
      queryClient.setQueryData(boardQueryKey, context?.previousState);
      showPopup({
        header: "Unable to delete card",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSuccess: () => {
      router.push(`/boards/${boardPublicId}`);
    },
    onSettled: async () => {
      closeModal();
      await queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
  });

  const handleDeleteCard = () => {
    deleteCardMutation.mutate({
      cardPublicId,
    });
  };

  return (
    <div className="p-5">
      <div className="flex w-full flex-col justify-between pb-4">
        <h2 className="text-md pb-4 font-medium text-neutral-900 dark:text-dark-1000">
          {"Are you sure you want to delete this card?"}
        </h2>
        <p className="text-sm font-medium text-light-900 dark:text-dark-900">
          {"This action can't be undone."}
        </p>
      </div>
      <div className="mt-5 flex justify-end sm:mt-6">
        <button
          className="mr-4 inline-flex justify-center rounded-md border-[1px] border-light-600 bg-light-50 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm focus-visible:outline-none dark:border-dark-600 dark:bg-dark-300 dark:text-dark-1000"
          onClick={() => closeModal()}
        >
          {"Cancel"}
        </button>
        <Button
          onClick={handleDeleteCard}
          isLoading={deleteCardMutation.isPending}
        >
          {"Delete"}
        </Button>
      </div>
    </div>
  );
}
