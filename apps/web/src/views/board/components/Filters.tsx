import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  HiMiniXMark,
  HiOutlineClock,
  HiOutlineSquare3Stack3D,
  HiOutlineTag,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { IoFilterOutline } from "react-icons/io5";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import CheckboxDropdown from "~/components/CheckboxDropdown";
import LabelIcon from "~/components/LabelIcon";
import {
  formatMemberDisplayName,
  formatToArray,
  getAvatarUrl,
} from "~/utils/helpers";

interface Member {
  publicId: string;
  user: {
    name: string | null;
    image: string | null;
    email: string;
  } | null;
}

interface Label {
  publicId: string;
  name: string;
  colourCode: string | null;
}

interface List {
  publicId: string;
  name: string;
}

const Filters = ({
  position = "right",
  labels,
  members,
  lists,
  isLoading,
}: {
  position?: "left" | "right";
  labels: Label[];
  members: Member[];
  lists: List[];
  isLoading: boolean;
}) => {
  const search = useSearch({ strict: false }) as Record<string, any>;
  const navigate = useNavigate();

  const clearFilters = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          members: [],
          labels: [],
          lists: [],
          dueDate: [],
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const formattedMembers = members.map((member) => ({
    key: member.publicId,
    value: formatMemberDisplayName(
      member.user?.name ?? null,
      member.user?.email ?? null,
    ),
    selected: !!formatToArray(search.members).includes(member.publicId),
    leftIcon: (
      <Avatar
        size="xs"
        name={member.user?.name ?? ""}
        imageUrl={
          member.user?.image ? getAvatarUrl(member.user.image) : undefined
        }
        email={member.user?.email ?? ""}
      />
    ),
  }));

  const formattedLabels = labels.map((label) => ({
    key: label.publicId,
    value: label.name,
    selected: !!formatToArray(search.labels).includes(label.publicId),
    leftIcon: <LabelIcon colourCode={label.colourCode} />,
  }));

  const formattedLists = lists.map((list) => ({
    key: list.publicId,
    value: list.name,
    selected: !!formatToArray(search.lists).includes(list.publicId),
  }));

  const dueDateItems = [
    {
      key: "overdue",
      value: "Overdue",
      selected: !!formatToArray(search.dueDate).includes("overdue"),
    },
    {
      key: "today",
      value: "Due today",
      selected: !!formatToArray(search.dueDate).includes("today"),
    },
    {
      key: "tomorrow",
      value: "Due tomorrow",
      selected: !!formatToArray(search.dueDate).includes("tomorrow"),
    },
    {
      key: "next-week",
      value: "Due next week",
      selected: !!formatToArray(search.dueDate).includes("next-week"),
    },
    {
      key: "next-month",
      value: "Due next month",
      selected: !!formatToArray(search.dueDate).includes("next-month"),
    },
    {
      key: "no-due-date",
      value: "No dates",
      selected: !!formatToArray(search.dueDate).includes("no-due-date"),
    },
  ];

  const groups = [
    ...(formattedMembers.length
      ? [
          {
            key: "members",
            label: "Members",
            icon: <HiOutlineUserCircle size={16} />,
            items: formattedMembers,
          },
        ]
      : []),
    {
      key: "labels",
      label: "Labels",
      icon: <HiOutlineTag size={16} />,
      items: formattedLabels,
    },
    ...(formattedLists.length
      ? [
          {
            key: "lists",
            label: "Lists",
            icon: <HiOutlineSquare3Stack3D size={16} />,
            items: formattedLists,
          },
        ]
      : []),
    {
      key: "dueDate",
      label: "Due date",
      icon: <HiOutlineClock size={16} />,
      items: dueDateItems,
    },
  ];

  const handleSelect = async (
    groupKey: string | null,
    item: { key: string },
  ) => {
    if (groupKey === null) return;
    const currentQuery = formatToArray(search[groupKey]);

    const updatedQuery = currentQuery.includes(item.key)
      ? currentQuery.filter((key) => key !== item.key)
      : [...currentQuery, item.key];

    try {
      await navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({ ...prev, [groupKey]: updatedQuery }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const numOfFilters = [
    ...formatToArray(search.members),
    ...formatToArray(search.labels),
    ...formatToArray(search.lists),
    ...formatToArray(search.dueDate),
  ].length;

  return (
    <div className="relative">
      <CheckboxDropdown
        groups={groups}
        handleSelect={handleSelect}
        menuSpacing="md"
        position={position}
      >
        <Button
          variant="secondary"
          disabled={isLoading}
          iconLeft={<IoFilterOutline />}
        >
          {"Filter"}
        </Button>
        {numOfFilters > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            aria-label={"Clear filters"}
            className="group absolute -right-[8px] -top-[8px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-light-100 bg-light-1000 text-[8px] font-[700] text-light-600 dark:border-dark-50 dark:bg-dark-1000 dark:text-dark-600"
          >
            <span className="group-hover:hidden">{numOfFilters}</span>
            <span className="hidden text-light-50 group-hover:inline dark:text-dark-50">
              <HiMiniXMark size={12} />
            </span>
          </button>
        )}
      </CheckboxDropdown>
    </div>
  );
};

export default Filters;
