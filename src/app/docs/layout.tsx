import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Petwise API Swagger",
  description: "Try Petwise scan endpoints",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
