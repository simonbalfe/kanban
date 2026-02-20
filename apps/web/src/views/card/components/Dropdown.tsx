import { useQuery } from "@tanstack/react-query";
import {
  HiEllipsisHorizontal,
  HiLink,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from "react-icons/hi2";

import Dropdown from "~/components/Dropdown";
import { useModal } from "~/providers/modal";
import { usePopup } from "~/providers/popup";
import { api, apiKeys } from "~/utils/api";

export default function CardDropdown({
  cardPublicId,
  isTemplate,
  boardPublicId,
  cardCreatedBy,
}: {
  cardPublicId: string;
  isTemplate?: boolean;
  boardPublicId?: string;
  cardCreatedBy?: string | null;
}) {
  const { openModal } = useModal();
  const { showPopup } = usePopup();
  const isAdminOrMember = true;
  const { data: currentUser } = useQuery({
    queryKey: apiKeys.user.getUser(),
    queryFn: api.user.getUser,
  });
  const isCreator = cardCreatedBy && currentUser?.id === cardCreatedBy;

  const handleCopyCardLink = async () => {
    const path =
      isTemplate && boardPublicId
        ? `/templates/${boardPublicId}/cards/${cardPublicId}`
        : `/cards/${cardPublicId}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      showPopup({
        header: "Link copied",
        icon: "success",
        message: "Card URL copied to clipboard",
      });
    } catch (error) {
      console.error(error);
      showPopup({
        header: "Unable to copy link",
        icon: "error",
        message: "Please try again.",
      });
    }
  };

  const items = [
    {
      label: "Copy card link",
      action: handleCopyCardLink,
      icon: <HiLink className="h-[16px] w-[16px] text-dark-900" />,
    },
    ...(isAdminOrMember
      ? [
          {
            label: "Add checklist",
            action: () => openModal("ADD_CHECKLIST"),
            icon: (
              <HiOutlineCheckCircle className="h-[16px] w-[16px] text-dark-900" />
            ),
          },
        ]
      : []),
    ...(isAdminOrMember || isCreator
      ? [
          {
            label: "Delete card",
            action: () => openModal("DELETE_CARD"),
            icon: (
              <HiOutlineTrash className="h-[16px] w-[16px] text-dark-900" />
            ),
          },
        ]
      : []),
  ];

  if (items.length === 0) {
    return null;
  }

  return (
    <Dropdown items={items}>
      <HiEllipsisHorizontal className="h-5 w-5 text-dark-900" />
    </Dropdown>
  );
}
