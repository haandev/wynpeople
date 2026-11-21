import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { inputCls } from "./ui";
import { ChevronDown } from "lucide-react";

export interface ComboOption {
  value: string;
  label: string;
  /** Second line under the label (job title, office…). */
  hint?: string | null;
  /** Shown before the label (an avatar). */
  icon?: ReactNode;
}

// Accent- and dotted/dotless-i-insensitive: "ist" finds "Istanbul" and "İstanbul", "sahin" finds "Şahin".
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/ı/g, "i");

/**
 * A type-to-search picker. Pass `options` for a list filtered on the client, or `onSearch` to
 * search on the server (the parent fetches and passes the results back as `options`).
 * `selectedLabel` names the current value when it is not among the options shown.
 */
export function Combobox({
  value,
  onChange,
  options,
  onSearch,
  selectedLabel,
  placeholder = "Type to search…",
  emptyLabel,
  loading = false,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  onSearch?: (term: string) => void;
  selectedLabel?: string | null;
  placeholder?: string;
  /** Offer a "nothing chosen" row with this text (e.g. "— unchanged —"). */
  emptyLabel?: string;
  loading?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    // The list lives in a portal, outside the box: a click in either keeps it open.
    const close = (e: MouseEvent) =>
      !box.current?.contains(e.target as Node) &&
      !list.current?.contains(e.target as Node) &&
      setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // The list is drawn on top of the page (a portal, position fixed) so no sticky table header, card or
  // modal can cover it; Safari draws a sticky header with backdrop-blur above a nested z-index (WDB-4329).
  // It follows the input while the page scrolls, and opens upwards when there is no room below.
  const [place, setPlace] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 8;
      const above = r.top - 8;
      const up = below < 200 && above > below;
      setPlace(
        up
          ? {
              bottom: window.innerHeight - r.top + 4,
              left: r.left,
              width: r.width,
              maxHeight: Math.min(256, above),
            }
          : {
              top: r.bottom + 4,
              left: r.left,
              width: r.width,
              maxHeight: Math.min(256, below),
            },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const shown = onSearch
    ? options
    : options.filter(
        (o) => !term || norm(`${o.label} ${o.hint ?? ""}`).includes(norm(term)),
      );
  // While searching, the "nothing chosen" row is hidden so Enter takes the first match.
  const rows: ComboOption[] =
    emptyLabel && !term ? [{ value: "", label: emptyLabel }, ...shown] : shown;
  const current =
    options.find((o) => o.value === value)?.label ?? selectedLabel ?? "";

  const type = (t: string) => {
    setTerm(t);
    setActive(0);
    setOpen(true);
    onSearch?.(t);
  };
  const pick = (o: ComboOption) => {
    onChange(o.value);
    setOpen(false);
    setTerm("");
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return type(term);
      const next = Math.max(
        0,
        Math.min(rows.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)),
      );
      setActive(next);
      list.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && open && rows[active]) {
      e.preventDefault();
      pick(rows[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={box}>
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={id}
        aria-autocomplete="list"
        className={`${inputCls} pr-8 ${invalid ? "border-red-400! ring-2 ring-red-500/15" : ""}`}
        placeholder={current || placeholder}
        value={open ? term : current}
        onFocus={() => type("")}
        // A click on the already focused input (after picking) opens the list again (WDB-4329).
        onClick={() => !open && type("")}
        onChange={(e) => type(e.target.value)}
        onKeyDown={key}
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-2.5 grid place-items-center text-stone-400"
        aria-hidden
      >
        <ChevronDown className="h-4 w-4" />
      </span>
      {open &&
        place &&
        createPortal(
          <ul
            id={id}
            ref={list}
            role="listbox"
            style={{
              position: "fixed",
              top: place.top,
              bottom: place.bottom,
              left: place.left,
              width: place.width,
              maxHeight: place.maxHeight,
            }}
            className="z-[60] overflow-auto rounded-xl bg-white py-1 shadow-pop ring-1 ring-stone-900/5"
          >
            {loading && (
              <li className="px-3 py-2 text-sm text-stone-500">Searching…</li>
            )}
            {!loading && rows.length === 0 && (
              <li className="px-3 py-2 text-sm text-stone-500">No match</li>
            )}
            {rows.map((o, i) => (
              <li
                key={o.value || "__empty"}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm ${i === active ? "bg-brand-50" : ""} ${o.value === value ? "font-medium" : ""}`}
              >
                {o.icon}
                <span className="min-w-0">
                  <span
                    className={`block truncate ${o.value ? "text-stone-800" : "text-stone-500"}`}
                  >
                    {o.label}
                  </span>
                  {o.hint && (
                    <span className="block truncate text-xs text-stone-500">
                      {o.hint}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
