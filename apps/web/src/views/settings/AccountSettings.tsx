import { useQuery } from "@tanstack/react-query";
import { PageHead } from "~/components/PageHead";
import { api, apiKeys } from "~/utils/api";
import Avatar from "./components/Avatar";
import UpdateDisplayNameForm from "./components/UpdateDisplayNameForm";

export default function AccountSettings() {
  const { data } = useQuery({
    queryKey: apiKeys.user.getUser(),
    queryFn: api.user.getUser,
  });

  return (
    <>
      <PageHead title={"Settings | Account"} />

      <div className="mb-8 border-t border-light-300 dark:border-dark-300">
        <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
          {"Profile picture"}
        </h2>
        <Avatar userId={data?.id} userImage={data?.image} />

        <div className="mb-4">
          <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
            {"Display name"}
          </h2>
          <UpdateDisplayNameForm displayName={data?.name ?? ""} />
        </div>

        <div className="mb-4">
          <h2 className="mb-4 mt-8 text-[14px] font-bold text-neutral-900 dark:text-dark-1000">
            {"Email"}
          </h2>
          <p className="text-sm text-neutral-700 dark:text-dark-900">{data?.email}</p>
        </div>

      </div>
    </>
  );
}
