"use client";
import { useEffect, useRef } from "react";

export default function BootstrapFree() {
  const ran = useRef(false);
  
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    
    // fire-and-forget bootstrap call
    fetch("/api/billing/bootstrap-free", { method: "POST" }).catch(() => {});
  }, []);
  
  return null;
} 