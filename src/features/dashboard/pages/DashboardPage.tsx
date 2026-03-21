"use client";

import React from "react";
import { Header } from "../components/Header";
import { FloatingSidebars } from "../components/FloatingSidebars";
import { DashUI } from "../components/DashUI";

export function DashboardPage() {
  return (
    <div style={{ fontFamily: "var(--font-poppins)" }}>
      <Header />
      <FloatingSidebars />
      <DashUI />
    </div>
  );
}
