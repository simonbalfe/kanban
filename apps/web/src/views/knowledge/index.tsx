import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { HiOutlinePlusSmall } from "react-icons/hi2";
import { TbBrandInstagram, TbBrandLinkedin, TbBrandTiktok, TbBrandX, TbBrandYoutube, TbExternalLink, TbFile, TbMusic, TbPhoto, TbUser } from "react-icons/tb";

import Badge from "~/components/Badge";
import Button from "~/components/Button";
import LabelIcon from "~/components/LabelIcon";
import Modal from "~/components/modal";
import { PageHead } from "~/components/PageHead";
import { useModal } from "~/providers/modal";
import { api, apiKeys } from "~/utils/api";
import { EditKnowledgeItemForm } from "./components/EditKnowledgeItemForm";
import { KnowledgeLabelForm } from "./components/KnowledgeLabelForm";
import { NewKnowledgeItemForm } from "./components/NewKnowledgeItemForm";

const typeIcons: Record<string, React.ReactNode> = {
  link: <TbExternalLink className="h-4 w-4" />,
  creator: <TbUser className="h-4 w-4" />,
  tweet: <TbBrandX className="h-4 w-4" />,
  instagram: <TbBrandInstagram className="h-4 w-4" />,
  tiktok: <TbBrandTiktok className="h-4 w-4" />,
  youtube: <TbBrandYoutube className="h-4 w-4" />,
  linkedin: <TbBrandLinkedin className="h-4 w-4" />,
  image: <TbPhoto className="h-4 w-4" />,
  pdf: <TbFile className="h-4 w-4" />,
  audio: <TbMusic className="h-4 w-4" />,
  other: <TbFile className="h-4 w-4" />,
};

export default function KnowledgeView() {
  const { openModal, modalContentType, isOpen, entityId, isInStack } = useModal();
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set());
  const { data: items, isLoading } = useQuery({
    queryKey: apiKeys.knowledgeItem.all(),
    queryFn: () => api.knowledgeItem.all(),
  });
  const { data: labels } = useQuery({
    queryKey: apiKeys.knowledgeLabel.all(),
    queryFn: () => api.knowledgeLabel.all(),
  });

  const toggleLabel = (publicId: string) => {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  };

  const filteredItems = items?.filter((item) => {
    if (selectedLabelIds.size === 0) return true;
    return item.labels.some((l) => selectedLabelIds.has(l.knowledgeLabel.publicId));
  });

  return (
    <>
      <PageHead title="Knowledge Base" />
      <div className="m-auto h-full max-w-[1100px] p-6 px-5 md:px-28 md:py-12">
        <div className="relative z-10 mb-8 flex w-full items-center justify-between">
          <h1 className="font-bold tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem]">
            Knowledge Base
          </h1>
          <Button
            type="button"
            variant="primary"
            onClick={() => openModal("NEW_KNOWLEDGE_ITEM")}
            iconLeft={
              <HiOutlinePlusSmall aria-hidden="true" className="h-4 w-4" />
            }
          >
            New
          </Button>
        </div>

        <Modal
          modalSize="sm"
          isVisible={isOpen && isInStack("NEW_KNOWLEDGE_ITEM")}
        >
          <NewKnowledgeItemForm />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "NEW_KNOWLEDGE_LABEL"}
        >
          <KnowledgeLabelForm />
        </Modal>

        <Modal
          modalSize="sm"
          isVisible={isOpen && modalContentType === "EDIT_KNOWLEDGE_ITEM"}
        >
          {entityId && <EditKnowledgeItemForm publicId={entityId} />}
        </Modal>

        {labels && labels.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {labels.map((label) => (
              <button
                key={label.publicId}
                type="button"
                onClick={() => toggleLabel(label.publicId)}
                className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedLabelIds.has(label.publicId)
                    ? "bg-neutral-900 text-white ring-1 ring-neutral-900 dark:bg-dark-900 dark:text-dark-100 dark:ring-dark-900"
                    : "text-neutral-600 ring-1 ring-inset ring-light-600 hover:bg-light-200 dark:text-dark-1000 dark:ring-dark-800 dark:hover:bg-dark-300"
                }`}
              >
                <LabelIcon colourCode={label.colourCode} />
                {label.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-neutral-500 dark:text-dark-800">
            Loading...
          </div>
        ) : !filteredItems?.length ? (
          <div className="text-sm text-neutral-500 dark:text-dark-800">
            {items?.length ? "No items match the selected labels." : "No items yet. Add your first knowledge item to get started."}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 overflow-hidden">
            {filteredItems.map((item) => (
              <button
                type="button"
                key={item.publicId}
                onClick={() =>
                  openModal("EDIT_KNOWLEDGE_ITEM", item.publicId)
                }
                className="flex w-full max-w-full items-center gap-3 rounded-lg border border-light-300 bg-white px-4 py-3 text-left transition-colors hover:border-light-600 sm:w-fit dark:border-dark-300 dark:bg-dark-200 dark:hover:border-dark-500"
              >
                <span className="text-neutral-500 dark:text-dark-800">
                  {typeIcons[item.type] ?? typeIcons.other}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-dark-1000">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="truncate text-xs text-neutral-500 dark:text-dark-800">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.labels.length > 0 && (
                  <div className="flex shrink gap-1 overflow-hidden">
                    {item.labels.map((l) => (
                      <Badge
                        key={l.knowledgeLabel.publicId}
                        value={l.knowledgeLabel.name}
                        iconLeft={
                          <LabelIcon
                            colourCode={l.knowledgeLabel.colourCode}
                          />
                        }
                      />
                    ))}
                  </div>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded p-1 text-neutral-400 hover:bg-light-200 hover:text-neutral-600 dark:text-dark-700 dark:hover:bg-dark-400 dark:hover:text-dark-900"
                  >
                    <TbExternalLink className="h-4 w-4" />
                  </a>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
