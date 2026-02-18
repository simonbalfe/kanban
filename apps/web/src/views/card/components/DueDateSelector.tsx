import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { HiMiniPlus } from "react-icons/hi2";

import DateSelector from "~/components/DateSelector";
import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

interface DueDateSelectorProps {
  cardPublicId: string;
  dueDate: string | Date | null | undefined;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DueDateSelector({
  cardPublicId,
  dueDate,
  isLoading = false,
  disabled = false,
}: DueDateSelectorProps) {
  const { showPopup } = usePopup();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null | undefined>(
    dueDate ? new Date(dueDate) : null,
  );

  useEffect(() => {
    if (!isOpen) {
      setPendingDate(dueDate ? new Date(dueDate) : null);
    }
  }, [dueDate, isOpen]);

  const cardByIdQueryKey = apiKeys.card.byId({ cardPublicId });
  const updateDueDate = useMutation({
    mutationFn: api.card.update,
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: cardByIdQueryKey });

      const previousCard = queryClient.getQueryData(cardByIdQueryKey);

      queryClient.setQueryData(cardByIdQueryKey, (oldCard: any) => {
        if (!oldCard) return oldCard;

        return {
          ...oldCard,
          dueDate:
            update.dueDate !== undefined
              ? (update.dueDate as string | null)
              : oldCard.dueDate,
        };
      });

      return { previousCard };
    },
    onError: (_error, _update, context) => {
      queryClient.setQueryData(cardByIdQueryKey, context?.previousCard);
      showPopup({
        header: "Unable to update due date",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      await invalidateCard(queryClient, cardPublicId);
      await queryClient.invalidateQueries({ queryKey: ["board", "byId"] });
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setPendingDate(date ?? null);
  };

  const handleBackdropClick = () => {
    const pendingIsNull = pendingDate === null || pendingDate === undefined;
    const dueIsNull = dueDate === null || dueDate === undefined;

    let dateChanged = false;
    if (pendingIsNull && !dueIsNull) {
      dateChanged = true;
    } else if (!pendingIsNull && dueIsNull) {
      dateChanged = true;
    } else if (!pendingIsNull && !dueIsNull) {
      dateChanged = new Date(pendingDate).getTime() !== new Date(dueDate).getTime();
    }

    setIsOpen(false);

    if (dateChanged) {
      updateDueDate.mutate({
        cardPublicId,
        dueDate: pendingDate ? pendingDate.toISOString() : null,
      });
    }
  };

  const displayDate = dueDate ? new Date(dueDate) : null;

  return (
    <div className="relative flex w-full items-center text-left">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={isLoading || disabled}
        className={`flex h-full w-full items-center rounded-[5px] border-[1px] border-light-50 py-1 pl-2 text-left text-xs text-neutral-900 dark:border-dark-50 dark:text-dark-1000 ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-light-300 hover:bg-light-200 dark:hover:border-dark-200 dark:hover:bg-dark-100"}`}
      >
        {displayDate ? (
          <span>{format(displayDate, "MMM d, yyyy")}</span>
        ) : (
          <>
            <HiMiniPlus size={22} className="pr-2" />
            {"Set due date"}
          </>
        )}
      </button>
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={handleBackdropClick} />
          <div
            className="absolute -left-8 top-full z-20 mt-2 rounded-md border border-light-200 bg-light-50 shadow-lg dark:border-dark-200 dark:bg-dark-100"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <DateSelector
              selectedDate={pendingDate ?? undefined}
              onDateSelect={handleDateSelect}
            />
          </div>
        </>
      )}
    </div>
  );
}
