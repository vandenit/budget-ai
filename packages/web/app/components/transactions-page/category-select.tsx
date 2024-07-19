"use client";
import Link from "next/link";
import { ChangeEvent, ChangeEventHandler } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Category } from "common-ts";

function CategorySelect({
  categoryUuid,
  categories,
  onChange,
}: {
  categoryUuid: string | undefined;
  categories: Category[];
  //category onChange
  onChange: (value: string) => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const navigateToCategory = (event: ChangeEvent<HTMLSelectElement>) => {
    const newCategoryUuid = event.target.value;
    const params = new URLSearchParams(searchParams);
    if (newCategoryUuid) {
      params.set("categoryUuid", newCategoryUuid);
    } else {
      params.delete("categoryUuid");
    }
    replace(`${pathname}?${params.toString()}`);
    onChange(newCategoryUuid);
  };

  return (
    <select
      className="select select-bordered w-full max-w-xs"
      value={categoryUuid}
      onChange={navigateToCategory}
    >
      {" "}
      <option value={""}>Select category</option>
      {categories.map((category) => (
        <option key={category.uuid} value={category.uuid}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

export default CategorySelect;
