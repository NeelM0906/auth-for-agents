import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/builder',
      permanent: false
    }
  };
};

export default function IndexRedirect() {
  return null;
}


