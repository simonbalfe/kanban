import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { HiXMark } from "react-icons/hi2";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { generateUID } from "~/lib/shared/utils";
import { useModal } from "~/providers/modal";
import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

interface NewChecklistFormInput {
  name: string;
  cardPublicId: string;
}

export function NewChecklistForm({ cardPublicId }: { cardPublicId: string }) {
  const { closeModal, setModalState } = useModal();
  const { showPopup } = usePopup();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch } =
    useForm<NewChecklistFormInput>({
      defaultValues: {
        name: "Checklist",
        cardPublicId,
      },
    });

  const cardQueryKey = apiKeys.card.byId({ cardPublicId });

  const createChecklist = useMutation({
    mutationFn: api.checklist.create,
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: cardQueryKey });
      const previous = queryClient.getQueryData(cardQueryKey);
      queryClient.setQueryData(cardQueryKey, (old: any) => {
        if (!old) return old;
        const placeholderChecklist = {
          publicId: `PLACEHOLDER_${generateUID()}`,
          name: args.name,
          index: old.checklists.length,
          items: [] as {
            publicId: string;
            title: string;
            completed: boolean;
            index: number;
          }[],
        };
        return {
          ...old,
          checklists: [...old.checklists, placeholderChecklist],
        };
      });
      return { previous };
    },
    onSuccess: (data) => {
      setModalState("ADD_CHECKLIST", { createdChecklistId: data.publicId });
    },
    onError: (_error: any, vars: any, ctx: any) => {
      if (ctx?.previous)
        queryClient.setQueryData(
          apiKeys.card.byId({ cardPublicId: vars.cardPublicId }),
          ctx.previous,
        );
      showPopup({
        header: "Unable to create checklist",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async (_data: any, _error: any, vars: any) => {
      await invalidateCard(queryClient, vars.cardPublicId);
    },
  });

  useEffect(() => {
    const nameElement: HTMLElement | null =
      document.querySelector<HTMLElement>("#checklist-name");
    if (nameElement) nameElement.focus();
  }, []);

  const onSubmit = (data: NewChecklistFormInput) => {
    closeModal();
    reset({
      name: "",
    });

    createChecklist.mutate({
      name: data.name,
      cardPublicId: data.cardPublicId,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="px-5 pt-5">
        <div className="flex w-full items-center justify-between pb-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-dark-1000">
            {"New checklist"}
          </h2>
          <button
            type="button"
            className="rounded p-1 hover:bg-light-200 focus:outline-none dark:hover:bg-dark-300"
            onClick={(e) => {
              e.preventDefault();
              closeModal();
            }}
          >
            <HiXMark size={18} className="text-light-900 dark:text-dark-900" />
          </button>
        </div>

        <Input
          id="checklist-name"
          placeholder={"Checklist name"}
          {...register("name")}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              await handleSubmit(onSubmit)();
            }
          }}
        />
      </div>
      <div className="mt-12 flex items-center justify-end border-t border-light-600 px-5 pb-5 pt-5 dark:border-dark-600">
        <div>
          <Button
            type="submit"
            disabled={createChecklist.isPending || !watch("name")}
          >
            {"Create checklist"}
          </Button>
        </div>
      </div>
    </form>
  );
}
