import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardView from "~/views/board";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const TemplatePage: NextPageWithLayout = () => {
  return (
    <>
      <BoardView isTemplate />
      <Popup />
    </>
  );
};

TemplatePage.getLayout = (page) => getDashboardLayout(page);

export default TemplatePage;
