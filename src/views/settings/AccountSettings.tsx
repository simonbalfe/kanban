import { t } from "@lingui/core/macro";

import { LanguageSelector } from "~/components/LanguageSelector";
import { PageHead } from "~/components/PageHead";
import { api } from "~/utils/api";
import Avatar from "./components/Avatar";
import UpdateDisplayNameForm from "./components/UpdateDisplayNameForm";

export default function AccountSettings() {
  const { data } = api.user.getUser.useQuery();

  return (
    <>
      <PageHead title={t`Settings | Account`} />

      <div className="mb-8 border-t border-light-300 dark:border-dark-300">
        <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
          {t`Profile picture`}
        </h2>
        <Avatar userId={data?.id} userImage={data?.image} />

        <div className="mb-4">
          <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
            {t`Display name`}
          </h2>
          <UpdateDisplayNameForm displayName={data?.name ?? ""} />
        </div>

        <div className="mb-4">
          <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
            {t`Email`}
          </h2>
          <p className="text-sm text-neutral-700 dark:text-dark-900">{data?.email}</p>
        </div>

        <div className="mb-8 border-t border-light-300 dark:border-dark-300">
          <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
            {t`Language`}
          </h2>
          <p className="mb-8 text-sm text-neutral-500 dark:text-dark-900">
            {t`Change your language preferences.`}
          </p>
          <LanguageSelector />
        </div>
      </div>
    </>
  );
}
