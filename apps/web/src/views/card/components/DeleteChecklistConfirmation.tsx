import { useMutation, useQueryClient } from "@tanstack/react-query";

import Button from "~/components/Button";
import { useModal } from "~/providers/modal";
import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

export function DeleteChecklistConfirmation({
  cardPublicId,
  checklistPublicId,
}: {
  cardPublicId: string;
  checklistPublicId: string;
}) {
  const { closeModal } = useModal();
  const { showPopup } = usePopup();
  const queryClient = useQueryClient();

  const cardQueryKey = apiKeys.card.byId({ cardPublicId });

  const deleteChecklist = useMutation({
    mutationFn: api.checklist.delete,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cardQueryKey });
      const previous = queryClient.getQueryData(cardQueryKey);
      queryClient.setQueryData(cardQueryKey, (old: any) => {
        if (!old) return old;
        const updatedChecklists = old.checklists.filter(
          (cl: any) => cl.publicId !== checklistPublicId,
        );
        return { ...old, checklists: updatedChecklists };
      });
      return { previous };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.previous) queryClient.setQueryData(cardQueryKey, ctx.previous);
      showPopup({
        header: "Unable to delete checklist",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      closeModal();
      await invalidateCard(queryClient, cardPublicId);
    },
  });

  const handleDelete = () => {
    deleteChecklist.mutate({ checklistPublicId });
  };

  return (
    <div className="p-5">
      <div className="flex w-full flex-col justify-between pb-4">
        <h2 className="text-md pb-4 font-medium text-neutral-900 dark:text-dark-1000">
          {"Are you sure you want to delete this checklist?"}
        </h2>
        <p className="text-sm font-medium text-light-900 dark:text-dark-900">
          {"This action can't be undone."}
        </p>
      </div>
      <div className="mt-5 flex justify-end space-x-2 sm:mt-6">
        <Button variant="secondary" onClick={() => closeModal()}>
          {"Cancel"}
        </Button>
        <Button onClick={handleDelete} isLoading={deleteChecklist.isPending}>
          {"Delete"}
        </Button>
      </div>
    </div>
  );
}
