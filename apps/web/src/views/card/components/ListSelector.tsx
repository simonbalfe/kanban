import { useMutation, useQueryClient } from "@tanstack/react-query";

import CheckboxDropdown from "~/components/CheckboxDropdown";
import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

interface ListSelectorProps {
  cardPublicId: string;
  lists: {
    key: string;
    value: string;
    selected: boolean;
  }[];
  isLoading: boolean;
  disabled?: boolean;
}

export default function ListSelector({
  cardPublicId,
  lists,
  isLoading,
  disabled = false,
}: ListSelectorProps) {
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();

  const cardQueryKey = apiKeys.card.byId({ cardPublicId });

  const updateCardList = useMutation({
    mutationFn: api.card.update,
    onMutate: async (newList) => {
      await queryClient.cancelQueries({ queryKey: cardQueryKey });
      const previousCard = queryClient.getQueryData(cardQueryKey);

      queryClient.setQueryData(cardQueryKey, (oldCard: any) => {
        if (!oldCard) return oldCard;

        return {
          ...oldCard,
          list: {
            ...oldCard.list,
            publicId: newList.listPublicId ?? "",
            name: oldCard.list.name ?? "",
            board: oldCard.list.board ?? null,
          },
        };
      });

      return { previousCard };
    },
    onError: (_error: any, _newList: any, context: any) => {
      queryClient.setQueryData(cardQueryKey, context?.previousCard);
      showPopup({
        header: "Unable to update list",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await invalidateCard(queryClient, cardPublicId);
    },
  });

  const selectedList = lists.find((list) => list.selected);

  return (
    <>
      {isLoading ? (
        <div className="flex w-full">
          <div className="h-full w-[150px] animate-pulse rounded-[5px] bg-light-300 dark:bg-dark-300" />
        </div>
      ) : (
        <CheckboxDropdown
          items={lists}
          handleSelect={(_, member) => {
            updateCardList.mutate({
              cardPublicId,
              listPublicId: member.key,
              index: 0,
            });
          }}
          disabled={disabled}
          asChild
        >
          <div
            className={`flex h-full w-full items-center rounded-[5px] border-[1px] border-light-50 py-1 pl-2 text-left text-xs text-neutral-900 dark:border-dark-50 dark:text-dark-1000 ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-light-300 hover:bg-light-200 dark:hover:border-dark-200 dark:hover:bg-dark-100"}`}
          >
            {selectedList?.value}
          </div>
        </CheckboxDropdown>
      )}
    </>
  );
}
