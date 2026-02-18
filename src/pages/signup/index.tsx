import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/boards",
      permanent: false,
    },
  };
};

export default function SignupPage() {
  return null;
}
