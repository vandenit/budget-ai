"use client";
import React, { useRef, useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  InteractionItem,
} from "chart.js";
import { Pie, getElementAtEvent } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

const MIN_PERCENTAGE_TO_DISPLAY = 4;

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

import { Category } from "@/app/api/budget.server";
import {
  isInflowCategory,
  ynabAbsoluteNumber,
  ynabNumber,
} from "@/app/utils/ynab";
import { isOnMobileDevice, valueToPercentageOfTotal } from "./util";
import { compose, filter } from "ramda";

type Props = {
  categories: Category[];
  month: string;
};

const options = {
  plugins: {
    legend: {
      display: false,
    },
  },
};

const colorPalette: string[] = [
  "rgb(255, 102, 51)",
  "rgb(255, 179, 153)",
  "rgb(255, 51, 255)",
  "rgb(255, 255, 153)",
  "rgb(0, 179, 230)",
  "rgb(230, 179, 51)",
  "rgb(51, 102, 230)",
  "rgb(153, 153, 102)",
  "rgb(153, 255, 153)",
  "rgb(179, 77, 77)",
  "rgb(128, 179, 0)",
  "rgb(128, 153, 0)",
  "rgb(230, 179, 179)",
  "rgb(102, 128, 179)",
  "rgb(102, 153, 26)",
  "rgb(255, 153, 230)",
  "rgb(204, 255, 26)",
  "rgb(255, 26, 102)",
  "rgb(230, 51, 26)",
  "rgb(51, 255, 204)",
  "rgb(102, 153, 77)",
  "rgb(179, 102, 204)",
  "rgb(77, 128, 0)",
  "rgb(179, 51, 0)",
  "rgb(204, 128, 204)",
  "rgb(102, 102, 77)",
  "rgb(153, 26, 255)",
  "rgb(230, 102, 255)",
  "rgb(77, 179, 255)",
  "rgb(26, 179, 153)",
  "rgb(230, 102, 179)",
  "rgb(51, 153, 26)",
  "rgb(204, 153, 153)",
  "rgb(179, 179, 26)",
  "rgb(0, 230, 128)",
  "rgb(77, 128, 102)",
  "rgb(128, 153, 128)",
  "rgb(230, 255, 128)",
  "rgb(26, 255, 51)",
  "rgb(153, 153, 51)",
  "rgb(255, 51, 128)",
  "rgb(204, 204, 0)",
  "rgb(102, 230, 77)",
  "rgb(77, 128, 204)",
  "rgb(153, 0, 179)",
  "rgb(230, 77, 102)",
  "rgb(77, 179, 128)",
  "rgb(255, 77, 77)",
  "rgb(153, 230, 230)",
  "rgb(102, 102, 255)",
];

const nameToColorIndex = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Ensure the hash is positive
  hash = Math.abs(hash);
  return hash % colorPalette.length;
};

const nameToUniqueColor = (name: string): string => {
  const color = colorPalette[nameToColorIndex(name)];
  return color;
};

type CategoryAmountType = "activity" | "balance" | "budgeted";
type CategoryAmountTypeWithProps = {
  type: CategoryAmountType;
  label: string;
  negative?: boolean; // if true positive values will be filtered out
};
const amountTypes: CategoryAmountTypeWithProps[] = [
  { type: "activity", label: "Spent", negative: true },
  { type: "balance", label: "Available" },
  { type: "budgeted", label: "Budgeted" },
];

const nonInflowCategoryWithUsage =
  (categoryAmountType: CategoryAmountType) => (category: Category) =>
    !isInflowCategory(category) && category[categoryAmountType] !== 0;

const extraAmountFitler =
  (categoryAmountType: CategoryAmountType) => (category: Category) => {
    const categoryWithProps = amountTypes.find(
      (amountType) => amountType.type === categoryAmountType
    );
    if (!categoryWithProps) return true;
    if (categoryWithProps.negative) {
      return category[categoryAmountType] < 0;
    }
    return true;
  };

const notExcludedCategory =
  (excludedCategories: string[]) => (category: Category) =>
    !excludedCategories.includes(category.categoryName);

export const CategoryPieChart = ({ categories, month }: Props) => {
  // category amount type state to be used by toggle
  const [categoryAmountType, setCategoryAmountType] =
    useState<CategoryAmountType>("activity");
  // categories to exclude from pie chart state
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);

  const getCategoryAmountTypeLabel = (type: CategoryAmountType) =>
    amountTypes.find((amountType) => amountType.type === type)?.label || "";

  const categoriesWithUsage: Category[] = compose(
    filter(nonInflowCategoryWithUsage(categoryAmountType)),
    filter(extraAmountFitler(categoryAmountType))
  )(categories);

  const filteredCategories = categoriesWithUsage.filter(
    notExcludedCategory(excludedCategories)
  );
  const totalAmount = filteredCategories.reduce(
    (total, category) =>
      total + ynabAbsoluteNumber(category[categoryAmountType]),
    0
  );

  const data = {
    labels: filteredCategories.map((category) => category.categoryName),
    datasets: [
      {
        type: "pie" as const,
        label: getCategoryAmountTypeLabel(categoryAmountType),
        data: filteredCategories.map((category) =>
          ynabAbsoluteNumber(category.activity)
        ),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: filteredCategories.map((category) =>
          nameToUniqueColor(category.categoryName)
        ),
        datalabels: {
          //black
          color: "#000000",
          formatter: (value: string, context: any) => {
            const percentage = valueToPercentageOfTotal(value, totalAmount);
            if (percentage < MIN_PERCENTAGE_TO_DISPLAY) {
              return "";
            }
            return (
              `${
                context.chart.data.labels[context.dataIndex]
              } ${valueToPercentageOfTotal(value, totalAmount)}%` || value
            );
            // This will display the label of each pie slice inside the slice
          },
        },
      },
    ],
  };

  const router = useRouter();
  const chartRef = useRef();

  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const { current: chart } = chartRef;
    if (!chart) {
      return;
    }
    handleChartEvent(getElementAtEvent(chart, event));
  };

  const toggleCategory = (categoryName: string) => {
    setExcludedCategories((excludedCategories) =>
      excludedCategories.includes(categoryName)
        ? excludedCategories.filter((category) => category !== categoryName)
        : [...excludedCategories, categoryName]
    );
  };

  const navigateToCategory = (categoryName: string) => {
    // navigate to category with router
    // todo should be parent component that handles this
    const category = categories.find(
      (category) => category.categoryName === categoryName
    );
    if (!category) return;

    router.push(
      `/budgets/${category.budgetId}/transactions?month=${month}&categoryId=${category.categoryId}`
    );
  };

  const handleChartEvent = (element: InteractionItem[]) => {
    if (!element.length) return;

    const { index } = element[0];
    const { labels } = data;
    if (!isOnMobileDevice()) {
      navigateToCategory(labels[index]);
    }
  };
  return (
    <>
      <AmountTypeToggle
        current={categoryAmountType}
        onChange={setCategoryAmountType}
      />
      <CategoryPieChartLegend
        categories={categoriesWithUsage}
        excludedCategories={excludedCategories}
        onToggleCategory={toggleCategory}
      />
      <Pie data={data} onClick={onClick} ref={chartRef} options={options} />
    </>
  );
};

const AmountTypeToggle = ({
  current,
  onChange,
}: {
  current: CategoryAmountType;
  onChange: (type: CategoryAmountType) => void;
}) => {
  const isActive = (type: CategoryAmountType) =>
    current === type ? "tab-active" : "";
  return (
    // daisyui boxed tab
    <div className="tabs tabs-boxed">
      {amountTypes.map((type) => (
        <button
          key={type.type}
          className={`tab ${isActive(type.type)}`}
          onClick={() => onChange(type.type)}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
};

const CategoryPieChartLegend = ({
  categories,
  excludedCategories,
  onToggleCategory,
}: {
  categories: Category[];
  excludedCategories: string[];
  onToggleCategory: (categoryName: string) => void;
}) => (
  <div className="flex flex-wrap m-2">
    {categories.map((category) => (
      <div className="flex items-center mx-2" key={category.categoryId}>
        <label className="cursor-pointer">
          <input
            type="checkbox"
            checked={!excludedCategories.includes(category.categoryName)}
            onChange={() => onToggleCategory(category.categoryName)}
          />
          <span
            className="ml-2"
            style={{
              color: nameToUniqueColor(category.categoryName),
            }}
          >
            {category.categoryName}
          </span>
        </label>
      </div>
    ))}
  </div>
);
