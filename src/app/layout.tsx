import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opta Copilot Sandbox",
  description: "AI-powered chat interface with Groq GPT-OSS-20B",
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
