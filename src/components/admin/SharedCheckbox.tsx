"use client";

import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
