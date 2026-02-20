import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { DraggableProvided } from "react-beautiful-dnd";
import ContentEditable from "react-contenteditable";
import { HiXMark } from "react-icons/hi2";
import { RiDraggable } from "react-icons/ri";
import { twMerge } from "tailwind-merge";

import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

interface ChecklistItemRowProps {
  item: {
    publicId: string;
    title: string;
    completed: boolean;
  };
  cardPublicId: string;
  onCreateNewItem?: () => void;
  viewOnly?: boolean;
  dragHandleProps?: DraggableProvided["dragHandleProps"];
  isDragging?: boolean;
}

export default function ChecklistItemRow({
  item,
  cardPublicId,
  onCreateNewItem,
  viewOnly = false,
  dragHandleProps,
  isDragging = false,
}: ChecklistItemRowProps) {
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();

  const [title, setTitle] = useState("");
  const [completed, setCompleted] = useState(false);

  const cardQueryKey = apiKeys.card.byId({ cardPublicId });

  const updateItem = useMutation({
    mutationFn: api.checklist.updateItem,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: cardQueryKey });
      const previous = queryClient.getQueryData(cardQueryKey);
      queryClient.setQueryData(cardQueryKey, (old: any) => {
        if (!old) return old;
        const updatedChecklists = old.checklists.map((cl: any) => ({
          ...cl,
          items: cl.items.map((ci: any) =>
            ci.publicId === item.publicId
              ? {
                  ...ci,
                  ...(vars.title !== undefined ? { title: vars.title } : {}),
                  ...(vars.completed !== undefined
                    ? { completed: vars.completed }
                    : {}),
                }
              : ci,
          ),
        }));
        return { ...old, checklists: updatedChecklists };
      });
      return { previous };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.previous) queryClient.setQueryData(cardQueryKey, ctx.previous);
      showPopup({
        header: "Unable to update checklist item",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await invalidateCard(queryClient, cardPublicId);
    },
  });

  const deleteItem = useMutation({
    mutationFn: api.checklist.deleteItem,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cardQueryKey });
      const previous = queryClient.getQueryData(cardQueryKey);
      queryClient.setQueryData(cardQueryKey, (old: any) => {
        if (!old) return old;
        const updatedChecklists = old.checklists.map((cl: any) => ({
          ...cl,
          items: cl.items.filter((ci: any) => ci.publicId !== item.publicId),
        }));
        return { ...old, checklists: updatedChecklists };
      });
      return { previous };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.previous) queryClient.setQueryData(cardQueryKey, ctx.previous);
      showPopup({
        header: "Unable to delete checklist item",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await invalidateCard(queryClient, cardPublicId);
    },
  });

  useEffect(() => {
    setTitle(item.title);
    setCompleted(item.completed);
  }, [item.title, item.completed]);

  const sanitizeHtmlToPlainText = (html: string): string =>
    html
      .replace(/<br\s*\/?>(\n)?/gi, "\n")
      .replace(/<div><br\s*\/?><\/div>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  const handleToggleCompleted = () => {
    if (viewOnly) return;
    setCompleted((prev) => !prev);
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      completed: !completed,
    });
  };

  const commitTitle = (rawHtml: string) => {
    if (viewOnly) return;
    const plain = sanitizeHtmlToPlainText(rawHtml);
    if (!plain || plain === item.title) {
      setTitle(item.title);
      return;
    }
    setTitle(plain);
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      title: plain,
    });
  };

  const handleDelete = () => {
    if (viewOnly) return;
    deleteItem.mutate({ checklistItemPublicId: item.publicId });
  };

  return (
    <div
      className={twMerge(
        "group relative flex items-start gap-3 rounded-md py-2 pl-4 hover:bg-light-100 dark:hover:bg-dark-100",
        isDragging && "opacity-80",
      )}
    >
      {!viewOnly && (
        <div
          {...dragHandleProps}
          className="absolute left-0 top-1/2 flex h-[20px] w-[20px] -translate-x-full -translate-y-1/2 cursor-grab items-center justify-center pr-1 opacity-0 transition-opacity group-hover:opacity-75 hover:opacity-100 active:cursor-grabbing"
        >
          <RiDraggable className="h-4 w-4 text-light-700 dark:text-dark-700" />
        </div>
      )}

      {viewOnly && <div className="w-[20px] flex-shrink-0" />}

      <label
        className={`relative mt-[2px] inline-flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center`}
      >
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => {
            if (viewOnly) {
              e.preventDefault();
              return;
            }
            handleToggleCompleted();
          }}
          className={twMerge(
            "h-[16px] w-[16px] appearance-none rounded-md border border-light-500 bg-transparent outline-none ring-0 checked:bg-blue-600 focus:shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none dark:border-dark-500 dark:hover:border-dark-500",
            viewOnly ? "cursor-default" : "cursor-pointer",
          )}
        />
      </label>
      <div className="flex-1 pr-7">
        <ContentEditable
          html={title}
          disabled={viewOnly}
          onChange={(e) => setTitle(e.target.value)}
          // @ts-expect-error - valid event
          onBlur={(e: Event) => {
            const innerHTML = (e.target as HTMLElement).innerHTML;
            commitTitle(innerHTML);
          }}
          className={twMerge(
            "m-0 min-h-[20px] w-full p-0 text-sm leading-[20px] text-light-950 outline-none focus-visible:outline-none dark:text-dark-950",
            viewOnly && "cursor-default",
          )}
          placeholder={"Add details..."}
          onKeyDown={(e) => {
            if (viewOnly) return;
            if (e.key === "Enter") {
              e.preventDefault();
              const innerHTML = (e.currentTarget as HTMLElement).innerHTML;
              commitTitle(innerHTML);
              onCreateNewItem?.();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setTitle(item.title);
            }
          }}
        />
      </div>
      {!viewOnly && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-light-900 group-hover:block hover:bg-light-200 dark:text-dark-700 dark:hover:bg-dark-200"
        >
          <HiXMark size={16} />
        </button>
      )}
    </div>
  );
}
