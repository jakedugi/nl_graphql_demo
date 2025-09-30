import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NL-GraphQL Demo",
  description: "AI-powered NL-GraphQL interface with Groq (GPT-OSS-20B)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
