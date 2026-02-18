import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import ContentEditable from "react-contenteditable";
import { useForm } from "react-hook-form";

import { generateUID } from "~/lib/shared/utils";

import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

interface FormValues {
  title: string;
}

interface NewChecklistItemFormProps {
  checklistPublicId: string;
  cardPublicId: string;
  onCancel: () => void;
  readOnly?: boolean;
}

const NewChecklistItemForm = ({
  checklistPublicId,
  cardPublicId,
  onCancel,
  readOnly = false,
}: NewChecklistItemFormProps) => {
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();

  const { setValue, watch, reset, getValues } = useForm<FormValues>({
    defaultValues: {
      title: "",
    },
  });

  const title = watch("title");

  const editableRef = useRef<HTMLElement | null>(null);
  const keepOpenRef = useRef(false);

  const refocusEditable = () => {
    const el = editableRef.current;
    if (!el) return;
    if (readOnly) return;
    el.focus();

    setTimeout(() => {
      el.focus();
    }, 100);
  };

  const cardQueryKey = apiKeys.card.byId({ cardPublicId });

  const addChecklistItemMutation = useMutation({
    mutationFn: api.checklist.createItem,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: cardQueryKey });
      const previous = queryClient.getQueryData(cardQueryKey);

      queryClient.setQueryData(cardQueryKey, (old: any) => {
        if (!old) return old;
        const placeholder = {
          publicId: `PLACEHOLDER_${generateUID()}`,
          title: vars.title,
          completed: false,
        };
        const updatedChecklists = old.checklists.map((cl: any) =>
          cl.publicId === checklistPublicId
            ? { ...cl, items: [...cl.items, placeholder] }
            : cl,
        );
        return { ...old, checklists: updatedChecklists };
      });

      if (keepOpenRef.current) {
        reset({ title: "" });
        if (editableRef.current) editableRef.current.innerHTML = "";
        refocusEditable();
      } else {
        onCancel();
      }

      return { previous };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.previous)
        queryClient.setQueryData(cardQueryKey, ctx.previous);
      showPopup({
        header: "Unable to add checklist item",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await invalidateCard(queryClient, cardPublicId);
    },
  });

  const sanitizeHtmlToPlainText = (html: string): string => {
    return html
      .replace(/<br\s*\/?>(\n)?/gi, "\n")
      .replace(/<div><br\s*\/?><\/div>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  const submitIfNotEmpty = (keepOpen: boolean) => {
    if (readOnly) return;
    keepOpenRef.current = keepOpen;
    const currentHtml = getValues("title") ?? "";
    const plain = sanitizeHtmlToPlainText(currentHtml);
    if (!plain) {
      onCancel();
      return;
    }
    addChecklistItemMutation.mutate({
      checklistPublicId,
      title: plain,
    });
  };

  useEffect(() => {
    refocusEditable();
  }, []);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="group relative flex h-9 items-center gap-3 rounded-md pl-4 hover:bg-light-100 dark:hover:bg-dark-100">
        <label className="relative inline-flex h-[16px] w-[16px] flex-shrink-0 cursor-default items-center justify-center">
          <input
            type="checkbox"
            disabled
            className="peer h-[16px] w-[16px] appearance-none rounded-md border border-light-500 bg-transparent outline-none ring-0 hover:border-light-500 hover:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none dark:border-dark-500 dark:hover:border-dark-500"
          />
        </label>
        <div className="flex-1 pr-7">
          <ContentEditable
            id={`checklist-item-input-${checklistPublicId}`}
            tabIndex={readOnly ? -1 : 0}
            placeholder={"Add an item..."}
            html={title}
            disabled={readOnly}
            onChange={(e) => setValue("title", e.target.value)}
            className="m-0 min-h-[20px] w-full p-0 text-sm leading-5 text-light-900 outline-none focus-visible:outline-none dark:text-dark-950"
            onBlur={() => submitIfNotEmpty(false)}
            onKeyDown={async (e) => {
              if (readOnly) return;
              if (e.key === "Enter") {
                e.preventDefault();
                submitIfNotEmpty(true);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onCancel();
              }
            }}
            innerRef={(el) => {
              editableRef.current = (el as unknown as HTMLElement) ?? null;
            }}
          />
        </div>
      </div>
    </form>
  );
};

export default NewChecklistItemForm;
