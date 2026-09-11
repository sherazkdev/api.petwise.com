import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Petwise API Docs",
  description: "Swagger UI for Petwise scan APIs",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
