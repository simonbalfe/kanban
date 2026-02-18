import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardsView from "~/views/boards";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const BoardsPage: NextPageWithLayout = () => {
  return (
    <>
      <BoardsView />
      <Popup />
    </>
  );
};

BoardsPage.getLayout = (page) => getDashboardLayout(page);

export default BoardsPage;
