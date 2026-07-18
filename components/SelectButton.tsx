"use client";
import { useState } from "react";
import DropdownMenu from "@/components/DropdownMenu";

type Option = { id: number; name: string };

interface SelectButtonProps<T extends Option> {
  options: T[];
  value: T | null;
  onSelect: (option: T) => void;
  onClear: () => void;
  placeholder?: string;
  clearLabel?: string;
}

export default function SelectButton<T extends Option>({
  options,
  value,
  onSelect,
  onClear,
  placeholder = "Select...",
  clearLabel = "Any",
}: SelectButtonProps<T>) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        className="rounded-[10px] border border-(--dark-color) font-regular h-10 lg:h-12.5 px-3 w-full bg-transparent text-left cursor-pointer flex items-center justify-between"
      >
        <span className={value ? "" : "opacity-60"}>
          {value ? value.name : placeholder}
        </span>
        <span className="opacity-60 text-sm ml-2">▾</span>
      </button>
      {show && (
        <DropdownMenu
          options={options}
          onSelect={(option) => {
            onSelect(option);
            setShow(false);
          }}
          onClear={() => {
            onClear();
            setShow(false);
          }}
          clearLabel={clearLabel}
        />
      )}
    </div>
  );
}
