import { getCategories } from "@/app/api/budget.server";
import Link from "next/link";
import { redirect } from "next/navigation";

async function CategorySelect({
  budgetId,
  categoryId,
  month,
}: {
  budgetId: string;
  categoryId: string | undefined;
  month?: string | undefined;
}) {
  const categories = await getCategories(budgetId);
  if (categories.length === 0) {
    redirect("/login");
  }
  return (
    <details className="dropdown">
      <summary className="m-1 btn">Select category</summary>
      <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52">
        {categories.map((category) => (
          <li key={category.categoryId} value={category.categoryId}>
            <Link
              className={categoryId === category.categoryId ? "active" : ""}
              href={`transactions?categoryId=${category.categoryId}&month=${month}`}
            >
              {category.categoryName}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default CategorySelect;
