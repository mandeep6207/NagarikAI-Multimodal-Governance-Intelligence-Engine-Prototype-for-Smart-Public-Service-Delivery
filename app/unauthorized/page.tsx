"use client";
/**
 * /unauthorized — This page will never be shown to users.
 * It immediately redirects to the user's correct role home.
 * Exists only as a safety net for any edge-case bookmark hits.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleHome } from "../config/roleConfig";

export default function UnauthorizedRedirect() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const home = getRoleHome(role) || "/login";
    router.replace(home);
  }, [router]);

  // Neutral loading state — never show "Access Denied"
  return <div className="min-h-screen bg-[#F4F6F9] animate-pulse" />;
}
