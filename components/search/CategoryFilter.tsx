"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";

const PREDEFINED_CATEGORIES = [
  "Alati",
  "Kampovanje",
  "Elektronika",
  "Društvene igre",
  "Prevoz",
];

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const dbCategories = useQuery(api.items.listCategories);

  // Merge predefined categories with any additional ones from DB
  const categories = dbCategories
    ? [...new Set([...PREDEFINED_CATEGORIES, ...dbCategories])]
    : PREDEFINED_CATEGORIES;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange(null)}
        className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selectedCategory === null
            ? "text-amber-900"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {selectedCategory === null && (
          <motion.div
            layoutId="category-pill"
            className="absolute inset-0 rounded-full bg-amber-100"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
        <span className="relative z-10">Sve</span>
      </button>

      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === category
              ? "text-amber-900"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {selectedCategory === category && (
            <motion.div
              layoutId="category-pill"
              className="absolute inset-0 rounded-full bg-amber-100"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{category}</span>
        </button>
      ))}
    </div>
  );
}
