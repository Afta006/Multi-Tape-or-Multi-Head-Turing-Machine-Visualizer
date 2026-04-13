"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./navbar.module.css";
import { useTheme } from "@/lib/ThemeContext";
import { BsSun, BsMoon } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [simulatorDropdownOpen, setSimulatorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;
  const isSimulatorActive = pathname === "/" || pathname === "/multi-head";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSimulatorDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`${styles.navbar} ${pathname.startsWith("/docs") ? styles.docsNavbar : ""}`}>
      <div className={styles.inner}>
        <div className={styles.brandSection}>
          <Link href="/" className={styles.brand}>
            TuringKit
          </Link>
          <nav className={styles.navLinks}>
            <div className={styles.dropdownContainer} ref={dropdownRef}>
              <button
                className={`${styles.navLink} ${isSimulatorActive ? styles.active : ""}`}
                onClick={() => setSimulatorDropdownOpen(!simulatorDropdownOpen)}
              >
                Simulation
              </button>
              {simulatorDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <Link
                    href="/"
                    className={`${styles.dropdownItem} ${isActive("/") ? styles.active : ""}`}
                    onClick={() => setSimulatorDropdownOpen(false)}
                  >
                    Multi-Tape
                  </Link>
                  <Link
                    href="/multi-head"
                    className={`${styles.dropdownItem} ${isActive("/multi-head") ? styles.active : ""}`}
                    onClick={() => setSimulatorDropdownOpen(false)}
                  >
                    Multi-Head
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/efficiency"
              className={`${styles.navLink} ${isActive("/efficiency") ? styles.active : ""}`}
            >
              Efficiency
            </Link>
            <Link
              href="/docs"
              className={`${styles.navLink} ${pathname.startsWith("/docs") ? styles.active : ""}`}
            >
              Docs
            </Link>
          </nav>
        </div>
        <button
          className={styles.toggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <BsSun /> : <BsMoon />}
        </button>
      </div>
    </header>
  );
}
