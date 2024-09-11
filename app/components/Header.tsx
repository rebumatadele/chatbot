"use client";
import { Button } from "@/components/ui/button";
import { Settings, Sun, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

interface Props {
  switchProvider: () => void;
}
const Header = ({ switchProvider }: Props) => {
  const path = usePathname();
  const isCreateBot = path.includes("create-bot");
  const buttonHref = isCreateBot ? "/" : "/create-bot";
  const buttonLabel = isCreateBot ? "Home" : "Create Your Own Bot";

  return (
    <header className="flex justify-between items-center p-4 bg-background border-b">
      <div className="text-2xl font-bold">Claude AI</div>
      <div className="flex items-center space-x-2">
        <Link href={buttonHref}>
          <Button variant="ghost">{buttonLabel}</Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            switchProvider();
            toast.success("Successfully switched Provider");
          }}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
