"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { oldPath } from "./navigation";
export default function OldLink(props: ComponentProps<typeof Link>) {
  const href = typeof props.href === "string" ? oldPath(props.href) : { ...props.href, pathname: oldPath(props.href.pathname || "/") };
  return <Link {...props} href={href} />;
}
