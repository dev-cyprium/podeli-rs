"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getItemUrl } from "@/lib/utils";

const dropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
    },
  }),
};

interface SearchBarProps {
  placeholder?: string;
  showButton?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchBar({
  placeholder = "Šta ti treba? (npr. bušilica, šator...)",
  showButton = true,
  onSearch,
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(inputValue, 300);
  const suggestions = useQuery(
    api.items.searchAutocomplete,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip"
  );

  // Compute whether dropdown should be open
  const hasSuggestions = suggestions && suggestions.length > 0;
  const isOpen = isDropdownOpen && hasSuggestions;

  // Create a stable key for suggestions to detect changes
  const suggestionsKey = useMemo(
    () => (suggestions ? suggestions.map((s) => s._id).join(",") : null),
    [suggestions]
  );

  // Reset selected index when suggestions change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1);
  }, [suggestionsKey]);

  // Auto-open dropdown when suggestions arrive
  useEffect(() => {
    if (hasSuggestions && inputValue.length >= 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDropdownOpen(true);
    }
  }, [hasSuggestions, inputValue.length]);

  const handleSearch = useCallback(() => {
    const query = inputValue.trim();
    if (onSearch) {
      onSearch(query);
    } else if (query) {
      router.push(`/pretraga?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/pretraga");
    }
    setIsDropdownOpen(false);
  }, [inputValue, onSearch, router]);

  const handleSelectSuggestion = useCallback(
    (suggestion: NonNullable<typeof suggestions>[number]) => {
      const url = getItemUrl(suggestion);
      router.push(url);
      setIsDropdownOpen(false);
      setInputValue("");
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || !suggestions || suggestions.length === 0) {
        if (e.key === "Enter") {
          handleSearch();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          } else {
            handleSearch();
          }
          break;
        case "Escape":
          setIsDropdownOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, handleSelectSuggestion, handleSearch]
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearInput = () => {
    setInputValue("");
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="rounded-2xl bg-card p-2 shadow-xl shadow-podeli-dark/10 ring-1 ring-border focus-within:ring-2 focus-within:ring-podeli-accent">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
          <div className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions && suggestions.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              className="h-12 w-full rounded-xl border-0 bg-muted pl-10 pr-10 text-base text-podeli-dark placeholder:text-muted-foreground focus:bg-muted focus:outline-none sm:bg-transparent sm:focus:bg-transparent"
              placeholder={placeholder}
            />
            {inputValue && (
              <button
                onClick={clearInput}
                className="absolute right-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-podeli-dark"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {showButton && (
            <button
              onClick={handleSearch}
              className="h-12 rounded-xl bg-podeli-accent px-6 text-base font-bold text-podeli-dark transition-colors hover:bg-podeli-accent/90 active:bg-podeli-accent/80 sm:ml-2 sm:h-10 sm:px-8"
            >
              Pronađi
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions && suggestions.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            transition={{ type: "spring", bounce: 0.25, duration: 0.3 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={suggestion._id}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <button
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                      selectedIndex === index
                        ? "bg-podeli-accent/10 text-podeli-dark"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium text-podeli-dark">
                      {suggestion.title}
                    </span>
                    <Badge
                      className={
                        selectedIndex === index
                          ? "border-podeli-accent/30 bg-podeli-accent/10 text-podeli-accent"
                          : ""
                      }
                    >
                      {suggestion.category}
                    </Badge>
                  </button>
                </motion.li>
              ))}
            </ul>
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={handleSearch}
                className="text-sm text-muted-foreground hover:text-podeli-accent"
              >
                Vidi sve rezultate za &quot;{inputValue}&quot; &rarr;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
