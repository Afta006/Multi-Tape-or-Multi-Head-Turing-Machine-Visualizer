"use client";

import React from "react";
import styles from "./styles.module.css";

export default function TextArea({
  holder,
  width,
  height,
  wrap = true,
  value,
  onChange,
  onKeyDown,
}: {
  holder: string;
  width?: number;
  height: number;
  wrap?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className={styles.textContainer}>
      <textarea
        className={styles.text}
        placeholder={holder}
        wrap={wrap ? "soft" : "off"}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{ width: width ? `${width}px` : "100%", height: `${height * 34}px` }}
      />
    </div>
  );
}