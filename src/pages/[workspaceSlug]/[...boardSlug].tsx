import type { GetServerSideProps } from "next";
import PublicBoardView from "~/views/public/board";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function PublicBoardsPage() {
  return <PublicBoardView />;
}
