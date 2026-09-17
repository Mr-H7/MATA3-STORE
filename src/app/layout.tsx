import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "MATA3 | مَتاع", description: "MATA3 customer store" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
