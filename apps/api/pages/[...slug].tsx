import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  return {
    props: {},
  };
};

export default function SPACatchAll() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ADminer</title>
        <link rel="stylesheet" href="/public/assets/index-CJL14lXF.css" />
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/public/assets/index-C8x6jhvG.js"></script>
      </body>
    </html>
  );
} 