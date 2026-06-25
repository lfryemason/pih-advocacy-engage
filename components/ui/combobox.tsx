"use client";

import {
  useState,
  useEffect,
  useRef,
  useDeferredValue,
  useMemo,
  memo,
} from "react";
import { ChevronsUpDown, Check } from "lucide-react";

export type ComboboxOption = { id: string; label: string };

const Option = memo(function Option({
  optionId,
  label,
  selected,
  highlighted,
  onClick,
  muted,
}: {
  optionId: string;
  label: string;
  selected: boolean;
  highlighted: boolean;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      id={optionId}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`flex w-full cursor-default select-none items-start gap-2 px-3 py-1.5 text-left text-sm ${highlighted ? "text-popover-accent-foreground bg-popover-accent" : ""} hover:text-popover-accent-foreground hover:bg-popover-accent ${selected && !highlighted ? "bg-accent text-accent-foreground" : ""}`}
    >
      <Check
        className={`mt-px h-4 w-4 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`}
      />
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
    </button>
  );
});

export function FilterCombobox({
  id,
  options,
  priorityIds,
  priorityGroupLabel,
  value,
  onChange,
  placeholder,
  clearLabel,
  required,
}: {
  id: string;
  options: ComboboxOption[];
  priorityIds?: Set<string>;
  priorityGroupLabel?: string;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  clearLabel?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  useEffect(() => {
    if (highlightedIndex < 0 || !listboxRef.current) return;
    const items =
      listboxRef.current.querySelectorAll<HTMLElement>('[role="option"]');
    items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
  }

  const { visibleOptions, priorityCount, showClear, clearOffset } =
    useMemo(() => {
      const q = deferredQuery.toLowerCase();
      const matches = (label: string) => label.toLowerCase().includes(q);
      const ids = priorityIds ?? new Set<string>();
      const priority = options.filter((o) => ids.has(o.id) && matches(o.label));
      const rest = options.filter((o) => !ids.has(o.id) && matches(o.label));
      const hasClear = clearLabel != null && matches(clearLabel);
      return {
        visibleOptions: [
          ...(hasClear ? [{ id: "", label: clearLabel!, muted: true }] : []),
          ...priority,
          ...rest,
        ] as (ComboboxOption & { muted?: boolean })[],
        priorityCount: priority.length,
        showClear: hasClear,
        clearOffset: hasClear ? 1 : 0,
      };
    }, [deferredQuery, options, priorityIds, clearLabel]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey && open)) {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setQuery(selected?.label ?? "");
        return;
      }
      setHighlightedIndex((i) => Math.min(i + 1, visibleOptions.length - 1));
    } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey && open)) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" || (e.key === " " && !open)) {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setQuery(selected?.label ?? "");
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        handleSelect(visibleOptions[highlightedIndex].id);
      }
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }

  const activeDescendant =
    open && highlightedIndex >= 0
      ? `${id}-option-${highlightedIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={activeDescendant}
          aria-haspopup="listbox"
          value={open ? query : (selected?.label ?? query)}
          placeholder={placeholder}
          required={required}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-8 text-left text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 opacity-50" />
      </div>

      {open && (
        <div
          ref={listboxRef}
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <div className="max-h-64 overflow-y-auto">
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No results.
              </p>
            ) : (
              <>
                {showClear && (
                  <Option
                    optionId={`${id}-option-0`}
                    label={clearLabel!}
                    selected={value === ""}
                    highlighted={highlightedIndex === 0}
                    muted
                    onClick={() => handleSelect("")}
                  />
                )}

                {priorityCount > 0 && (
                  <>
                    <p className="px-3 py-1 text-xs font-medium text-muted-foreground">
                      {priorityGroupLabel ?? ""}
                    </p>
                    {visibleOptions
                      .slice(clearOffset, clearOffset + priorityCount)
                      .map((o, i) => {
                        const idx = clearOffset + i;
                        return (
                          <Option
                            key={o.id}
                            optionId={`${id}-option-${idx}`}
                            label={o.label}
                            selected={o.id === value}
                            highlighted={highlightedIndex === idx}
                            onClick={() => handleSelect(o.id)}
                          />
                        );
                      })}
                    {visibleOptions.length > clearOffset + priorityCount && (
                      <div className="my-1 border-t" />
                    )}
                  </>
                )}

                {visibleOptions
                  .slice(clearOffset + priorityCount)
                  .map((o, i) => {
                    const idx = clearOffset + priorityCount + i;
                    return (
                      <Option
                        key={o.id}
                        optionId={`${id}-option-${idx}`}
                        label={o.label}
                        selected={o.id === value}
                        highlighted={highlightedIndex === idx}
                        onClick={() => handleSelect(o.id)}
                      />
                    );
                  })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
