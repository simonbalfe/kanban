import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import { SettingsLayout } from "~/components/SettingsLayout";
import WorkspaceSettings from "~/views/settings/WorkspaceSettings";
import Popup from "~/components/Popup";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const WorkspaceSettingsPage: NextPageWithLayout = () => {
  return (
    <SettingsLayout currentTab="workspace">
      <WorkspaceSettings />
      <Popup />
    </SettingsLayout>
  );
};

WorkspaceSettingsPage.getLayout = (page) => getDashboardLayout(page);

export default WorkspaceSettingsPage;
