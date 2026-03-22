"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function OfficerInboxRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/officer/complaints"); }, [router]);
  return <div className="min-h-screen bg-[#F4F6F9] animate-pulse" />;
}
