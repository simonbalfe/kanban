import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

export default function ChecklistNameInput({
  checklistPublicId,
  initialName,
  cardPublicId,
  viewOnly = false,
}: {
  checklistPublicId: string;
  initialName: string;
  cardPublicId: string;
  viewOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const cardQueryKey = apiKeys.card.byId({ cardPublicId });

  const update = useMutation({
    mutationFn: api.checklist.update,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: cardQueryKey });
      const previous = queryClient.getQueryData(cardQueryKey);
      queryClient.setQueryData(cardQueryKey, (old: any) => {
        if (!old) return old;
        const updated = old.checklists.map((cl: any) =>
          cl.publicId === checklistPublicId ? { ...cl, name: vars.name } : cl,
        );
        return { ...old, checklists: updated };
      });
      return { previous };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.previous) queryClient.setQueryData(cardQueryKey, ctx.previous);
      showPopup({
        header: "Unable to update checklist",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await invalidateCard(queryClient, cardPublicId);
    },
  });

  const commit = () => {
    if (viewOnly) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) return;
    update.mutate({ checklistPublicId, name: trimmed });
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={name}
      readOnly={viewOnly}
      onChange={(e) => setName(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (viewOnly) return;
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          inputRef.current?.blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setName(initialName);
          inputRef.current?.blur();
        }
      }}
      title={name}
      className={twMerge(
        "text-md block w-full truncate border-0 bg-transparent p-0 py-0 font-medium text-light-1000 outline-none focus:ring-0 dark:text-dark-1000",
        viewOnly && "cursor-default",
      )}
    />
  );
}
