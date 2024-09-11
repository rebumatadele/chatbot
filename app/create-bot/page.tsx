"use client";

import React, { useState } from "react";
import Header from "../components/Header";

import SearchRoom from "./SearchRoom";

export default function Page() {
  const [useClaude, setUseClaude] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Header
        switchProvider={() => {
          setUseClaude((prev) => !prev);
        }}
      />
      <SearchRoom switchClaude={useClaude}/>
    </div>
  );
}
