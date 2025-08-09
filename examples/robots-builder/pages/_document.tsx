import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }
  render() {
    return (
      <Html>
        <Head />
        <body>
          <script dangerouslySetInnerHTML={{ __html: `window.__A4A_API_BASE__ = ${JSON.stringify(process.env.NEXT_PUBLIC_POLICY_BUILDER_API_BASE || 'http://localhost:4005')};` }} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}


