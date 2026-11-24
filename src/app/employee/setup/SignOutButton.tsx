"use client";
import { useTransition } from "react";
import { Icon } from "@/components/Icon";
import { signOut } from "../actions";

export function SignOutButton() {
  const [pending, start] = useTransition();
  return <button className="sm" disabled={pending} onClick={() => start(() => signOut())}><Icon name="out" /> Sign out</button>;
}
