"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import styles from "./sidebar-link.module.css";

export default function SidebarLink({ href, node, level }: { href: string; node: { name: string }; level: number }) {
    const path = usePathname()
    const isTopLevel = level === 0;

    const classNames = [
        styles.link,
        path === href ? styles.active : "",
        isTopLevel ? styles.topLevel : ""
    ].filter(Boolean).join(" ");
    return (
        <Link
            href={href}
            className={classNames}
            style={{ marginLeft: isTopLevel ? 0 : level * 16 }}
        >
              <span style={{ textTransform: "capitalize", display: "block" }}>
                  {node.name === "app" ? "Home" : node.name.split("-").join(" ")}
              </span>
        </Link>
    );
}