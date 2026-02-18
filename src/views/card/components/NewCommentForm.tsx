import { useForm } from "react-hook-form";
import { HiOutlineArrowUp } from "react-icons/hi2";

import Editor from "~/components/Editor";
import LoadingSpinner from "~/components/LoadingSpinner";
import { usePopup } from "~/providers/popup";
import { api } from "~/utils/api";
import { invalidateCard } from "~/utils/cardInvalidation";

interface FormValues {
  comment: string;
}

const NewCommentForm = ({
  cardPublicId,
}: {
  cardPublicId: string;
}) => {
  const utils = api.useUtils();
  const { showPopup } = usePopup();
  const isAdminOrMember = true;
  const { handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    values: {
      comment: "",
    },
  });

  const addCommentMutation = api.card.addComment.useMutation({
    onError: (_error, _newList) => {
      showPopup({
        header: "Unable to add comment",
        message: "Please try again later, or contact customer support.",
        icon: "error",
      });
    },
    onSettled: async () => {
      reset();
      await invalidateCard(utils, cardPublicId);
    },
  });

  const onSubmit = (data: FormValues) => {
    addCommentMutation.mutate({
      cardPublicId,
      comment: data.comment,
    });
  };

  if (!isAdminOrMember) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-[800px] flex-col rounded-xl border border-light-600 bg-light-100 p-4 text-light-900 focus-visible:outline-none dark:border-dark-400 dark:bg-dark-100 dark:text-dark-1000 sm:text-sm sm:leading-6"
    >
      <Editor
        content={watch("comment")}
        onChange={(value) => setValue("comment", value)}
        workspaceMembers={[]}
        placeholder={"Add comment... (type '/' to open commands or '@' to mention)"}
        disableHeadings={true}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={addCommentMutation.isPending}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-light-600 bg-light-300 hover:bg-light-400 disabled:opacity-50 dark:border-dark-400 dark:bg-dark-200 dark:hover:bg-dark-400"
        >
          {addCommentMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <HiOutlineArrowUp />
          )}
        </button>
      </div>
    </form>
  );
};

export default NewCommentForm;
