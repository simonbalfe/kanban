import type { GetServerSideProps } from "next";
import PublicBoardsView from "~/views/public/boards";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function PublicBoardsPage() {
  return <PublicBoardsView />;
}
