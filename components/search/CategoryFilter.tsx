"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const categories = useQuery(api.categories.listNames) ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={() => onCategoryChange(null)}
        className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selectedCategory === null
            ? "text-podeli-dark"
            : "text-muted-foreground hover:bg-muted hover:text-podeli-dark"
        }`}
      >
        {selectedCategory === null && (
          <motion.div
            layoutId="category-pill"
            className="absolute inset-0 rounded-full bg-podeli-accent/10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
        <span className="relative z-10">Sve</span>
      </Button>

      {categories.map((category) => (
        <Button
          variant="ghost"
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === category
              ? "text-podeli-dark"
              : "text-muted-foreground hover:bg-muted hover:text-podeli-dark"
          }`}
        >
          {selectedCategory === category && (
            <motion.div
              layoutId="category-pill"
              className="absolute inset-0 rounded-full bg-podeli-accent/10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{category}</span>
        </Button>
      ))}
    </div>
  );
}
