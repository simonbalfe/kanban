import {
  HiEllipsisHorizontal,
  HiLink,
  HiOutlineDocumentDuplicate,
  HiOutlineTrash,
} from "react-icons/hi2";

import Dropdown from "~/components/Dropdown";
import { useModal } from "~/providers/modal";

export default function BoardDropdown({
  isTemplate,
  isLoading,
}: {
  isTemplate: boolean;
  isLoading: boolean;
}) {
  const { openModal } = useModal();
  const isAdminOrMember = true;

  const items = [
    ...(isTemplate && isAdminOrMember
      ? [
          {
            label: "Make template",
            action: () => openModal("CREATE_TEMPLATE"),
            icon: (
              <HiOutlineDocumentDuplicate className="h-[16px] w-[16px] text-dark-900" />
            ),
          },
        ]
      : []),
    ...(!isTemplate && isAdminOrMember
      ? [
          {
            label: "Edit board URL",
            action: () => openModal("UPDATE_BOARD_SLUG"),
            icon: <HiLink className="h-[16px] w-[16px] text-dark-900" />,
          },
        ]
      : []),
    ...(isAdminOrMember
      ? [
          {
            label: isTemplate ? "Delete template" : "Delete board",
            action: () => openModal("DELETE_BOARD"),
            icon: <HiOutlineTrash className="h-[16px] w-[16px] text-dark-900" />,
          },
        ]
      : []),
  ];

  if (items.length === 0) {
    return null;
  }

  return (
    <Dropdown disabled={isLoading} items={items}>
      <HiEllipsisHorizontal className="h-5 w-5 text-dark-900" />
    </Dropdown>
  );
}
