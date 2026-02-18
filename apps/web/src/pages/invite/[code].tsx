import type { GetServerSideProps } from "next";

import InviteView from "~/views/invite";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function InvitePage() {
  return <InviteView />;
}
