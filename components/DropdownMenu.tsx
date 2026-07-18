"use client";

type Option = { id: number; name: string };

interface DropdownMenuProps<T extends Option> {
  options: T[];
  onSelect: (option: T) => void;
  emptyMessage?: string;
  onClear?: () => void;
  clearLabel?: string;
}

export default function DropdownMenu<T extends Option>({
  options,
  onSelect,
  emptyMessage = "No matches",
  onClear,
  clearLabel = "Any",
}: DropdownMenuProps<T>) {
  return (
    <ul className="absolute z-10 w-full mt-1 rounded-[10px] border border-(--dark-color) bg-(--light-color) overflow-hidden max-h-48 overflow-y-auto">
      {onClear && (
        <li
          onClick={onClear}
          className="px-3 py-2 cursor-pointer opacity-60 hover:bg-(--dark-color) hover:text-(--light-color)"
        >
          {clearLabel}
        </li>
      )}
      {options.length === 0 && (
        <li className="px-3 py-2 opacity-60">{emptyMessage}</li>
      )}
      {options.map((option) => (
        <li
          key={option.id}
          onClick={() => onSelect(option)}
          className="px-3 py-2 cursor-pointer hover:bg-(--dark-color) hover:text-(--light-color)"
        >
          {option.name}
        </li>
      ))}
    </ul>
  );
}
