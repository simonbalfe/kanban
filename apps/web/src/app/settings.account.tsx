import { createFileRoute } from "@tanstack/react-router";
import { getDashboardLayout } from "~/components/Dashboard";
import { SettingsLayout } from "~/components/SettingsLayout";
import AccountSettings from "~/views/settings/AccountSettings";

export const Route = createFileRoute("/settings/account")({
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  return getDashboardLayout(
    <SettingsLayout currentTab="account">
      <AccountSettings />
    </SettingsLayout>,
  );
}
