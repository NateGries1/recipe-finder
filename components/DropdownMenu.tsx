"use client";

type Option = { id: number; name: string };

interface DropdownMenuProps<T extends Option> {
  options: T[];
  onSelect: (option: T) => void;
  emptyMessage?: string;
  onClear?: () => void;
  clearLabel?: string;
  current?: string;
  addCurrentLabel?: string;
  handleSelectCurrent?: (value: string) => void;
}

export default function DropdownMenu<T extends Option>({
  options,
  onSelect,
  emptyMessage = "No matches",
  onClear,
  clearLabel,
  current,
  addCurrentLabel,
  handleSelectCurrent,
}: DropdownMenuProps<T>) {
  return (
    <div className="flex flex-col text-left absolute z-10 w-full mt-1 rounded-[10px] border border-(--dark-color) bg-(--light-color) overflow-hidden max-h-48 overflow-y-auto">
      {onClear && (
        <button
          onClick={onClear}
          className="w-full px-3 py-2 text-left cursor-pointer opacity-60 hover:bg-(--dark-color) hover:text-(--light-color)"
        >
          {clearLabel ?? "\u00A0"}
        </button>
      )}
      {handleSelectCurrent && current && addCurrentLabel && (
        <button
          onClick={() => handleSelectCurrent(current)}
          className="w-full px-3 py-2 text-left cursor-pointer opacity-60 hover:bg-(--dark-color) hover:text-(--light-color)"
        >
          {addCurrentLabel}
        </button>
      )}
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option)}
          className="w-full px-3 py-2 text-left cursor-pointer hover:bg-(--dark-color) hover:text-(--light-color)"
        >
          {option.name}
        </button>
      ))}
    </div>
  );
}
