import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import { SettingsLayout } from "~/components/SettingsLayout";
import AccountSettings from "~/views/settings/AccountSettings";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const AccountSettingsPage: NextPageWithLayout = () => {
  return (
    <SettingsLayout currentTab="account">
      <AccountSettings />
    </SettingsLayout>
  );
};

AccountSettingsPage.getLayout = (page) => getDashboardLayout(page);

export default AccountSettingsPage;
