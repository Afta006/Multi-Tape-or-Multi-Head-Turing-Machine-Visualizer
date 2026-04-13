import {Roboto} from "next/font/google";
import styles from "./layout.module.css";
import Sidebar from "@/components/doc-components/sidebar/sidebar";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100","300","400","500","700","900"],
  style: ["italic","normal"]
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.sidebar}>
            <Sidebar/>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
}
