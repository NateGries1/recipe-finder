"use client";
import { useState } from "react";
import DropdownMenu from "@/components/DropdownMenu";

type Option = { id: number; name: string };

interface SearchInputProps<T extends Option> {
  query: string;
  onQueryChange: (value: string) => void;
  options: T[];
  onSelect: (option: T) => void;
  placeholder?: string;
  emptyMessage?: string;
  closeOnSelect?: boolean;
}

export default function SearchInput<T extends Option>({
  query,
  onQueryChange,
  options,
  onSelect,
  placeholder,
  emptyMessage,
  closeOnSelect = true,
}: SearchInputProps<T>) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        className="rounded-[10px] border border-(--dark-color) font-regular h-10 lg:h-12.5 px-3 w-full bg-transparent"
        placeholder={placeholder}
      />
      {show && (
        <DropdownMenu
          options={options}
          onSelect={(option) => {
            onSelect(option);
            if (closeOnSelect) setShow(false);
          }}
          emptyMessage={emptyMessage}
        />
      )}
    </div>
  );
}
