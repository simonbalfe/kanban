import type { GetServerSideProps } from "next";
import LoginView from "~/views/auth/login";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function LoginPage() {
  return <LoginView />;
}
