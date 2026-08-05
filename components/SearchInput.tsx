"use client";
import { useState } from "react";
import DropdownMenu from "@/components/DropdownMenu";

type Option = { id: number; name: string };

interface SearchInputProps<T extends Option> {
  query: string;
  options: T[];
  placeholder?: string;
  emptyMessage?: string;
  closeOnSelect?: boolean;
  addCurrentLabel?: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: T) => void;
  handleEnter?: (value: string) => void;
  handleSelectCurrent?: (value: string) => void;
}

export default function SearchInput<T extends Option>({
  query,
  onQueryChange,
  options,
  onSelect,
  placeholder,
  emptyMessage,
  closeOnSelect = true,
  handleEnter,
  addCurrentLabel,
  handleSelectCurrent,
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
        onKeyDown={(e) => {
          if (e.key === "Enter" && handleEnter) {
            e.preventDefault();
            if (closeOnSelect) setShow(false);
            handleEnter(query);
          }
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
          current={query}
          addCurrentLabel={addCurrentLabel}
          handleSelectCurrent={handleSelectCurrent ?? onQueryChange}
        />
      )}
    </div>
  );
}
