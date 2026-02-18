import type { GetServerSideProps } from "next";
import SignupView from "~/views/auth/signup";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function SignupPage() {
  return <SignupView />;
}
