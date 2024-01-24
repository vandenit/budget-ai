"use client";
import { Category } from "@/app/api/budget.server";
import Link from "next/link";
import { ChangeEvent, ChangeEventHandler } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { on } from "events";

async function CategorySelect({
  budgetId,
  categoryId,
  month,
  categories,
  onChange,
}: {
  budgetId: string;
  categoryId: string | undefined;
  month?: string | undefined;
  categories: Category[];
  //category onChange
  onChange: (value: string) => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const navigateToCategory = (event: ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = event.target.value;
    console.log("navigateToCategory:??" + newCategoryId);
    const params = new URLSearchParams(searchParams);
    if (newCategoryId) {
      params.set("categoryId", newCategoryId);
    } else {
      params.delete("categoryId");
    }
    replace(`${pathname}?${params.toString()}`);
    onChange(newCategoryId);
  };

  return (
    <select
      className="select select-bordered w-full max-w-xs"
      value={categoryId}
      onChange={navigateToCategory}
    >
      {" "}
      <option>Select category</option>
      {categories.map((category) => (
        <option key={category.categoryId} value={category.categoryId}>
          {category.categoryName}
        </option>
      ))}
    </select>
  );
}

export default CategorySelect;
