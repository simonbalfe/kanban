import { t } from "@lingui/core/macro";

import FeedbackModal from "~/components/FeedbackModal";
import Modal from "~/components/modal";
import { NewWorkspaceForm } from "~/components/NewWorkspaceForm";
import { PageHead } from "~/components/PageHead";
import { usePermissions } from "~/hooks/usePermissions";
import { useModal } from "~/providers/modal";
import { useWorkspace } from "~/providers/workspace";
import { api } from "~/utils/api";
import Button from "~/components/Button";
import { DeleteWorkspaceConfirmation } from "./components/DeleteWorkspaceConfirmation";
import UpdateWorkspaceDescriptionForm from "./components/UpdateWorkspaceDescriptionForm";
import UpdateWorkspaceEmailVisibilityForm from "./components/UpdateWorkspaceEmailVisibilityForm";
import UpdateWorkspaceNameForm from "./components/UpdateWorkspaceNameForm";
import UpdateWorkspaceUrlForm from "./components/UpdateWorkspaceUrlForm";

export default function WorkspaceSettings() {
  const { modalContentType, openModal, isOpen } = useModal();
  const { workspace } = useWorkspace();
  const { isAdmin } = usePermissions();

  const { data: workspaceData } = api.workspace.byId.useQuery(
    { workspacePublicId: workspace.publicId },
    { enabled: !!workspace.publicId && workspace.publicId.length >= 12 },
  );

  return (
    <>
      <PageHead title={t`Settings | Workspace`} />

      <div className="mb-8 border-t border-light-300 dark:border-dark-300">
        <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
          {t`Workspace name`}
        </h2>
        <UpdateWorkspaceNameForm
          workspacePublicId={workspace.publicId}
          workspaceName={workspace.name}
          disabled={!isAdmin}
        />

        <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
          {t`Workspace URL`}
        </h2>
        <UpdateWorkspaceUrlForm
          workspacePublicId={workspace.publicId}
          workspaceUrl={workspace.slug ?? ""}
          disabled={!isAdmin}
        />

        <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
          {t`Workspace description`}
        </h2>
        <UpdateWorkspaceDescriptionForm
          workspacePublicId={workspace.publicId}
          workspaceDescription={workspace.description ?? ""}
          disabled={!isAdmin}
        />

        <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
          {t`Email visibility`}
        </h2>
        <UpdateWorkspaceEmailVisibilityForm
          workspacePublicId={workspace.publicId}
          showEmailsToMembers={Boolean(
            workspaceData?.showEmailsToMembers ?? false,
          )}
          disabled={!isAdmin}
        />

        <div className="border-t border-light-300 dark:border-dark-300">
          <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
            {t`Delete workspace`}
          </h2>
          <p className="mb-8 text-sm text-neutral-500 dark:text-dark-900">
            {t`Once you delete your workspace, there is no going back. This action cannot be undone.`}
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => openModal("DELETE_WORKSPACE")}
              disabled={workspace.role !== "admin"}
            >
              {t`Delete workspace`}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        modalSize="sm"
        isVisible={isOpen && modalContentType === "DELETE_WORKSPACE"}
      >
        <DeleteWorkspaceConfirmation />
      </Modal>

      <Modal
        modalSize="md"
        isVisible={isOpen && modalContentType === "NEW_FEEDBACK"}
      >
        <FeedbackModal />
      </Modal>
      <Modal
        modalSize="sm"
        isVisible={isOpen && modalContentType === "NEW_WORKSPACE"}
      >
        <NewWorkspaceForm />
      </Modal>
    </>
  );
}
