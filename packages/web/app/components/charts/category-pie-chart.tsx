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

import { isOnMobileDevice, valueToPercentageOfTotal } from "./util";
import { filter, pipe } from "ramda";
import { Category, isInflowCategory } from "common-ts";
import { absoluteD1000Number, formatAmount } from "common-ts";

type Props = {
  categories: Category[];
  month: string;
  budgetUuid: string;
  selectedAmountTypes?: CategoryAmountType[];
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
    !excludedCategories.includes(category.name);

export const CategoryPieChart = ({
  categories,
  month,
  budgetUuid,
  selectedAmountTypes,
}: Props) => {
  // category amount type state to be used by toggle
  const [categoryAmountType, setCategoryAmountType] =
    useState<CategoryAmountType>("activity");
  // categories to exclude from pie chart state
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);

  const getCategoryAmountTypeLabel = (type: CategoryAmountType) =>
    amountTypes.find((amountType) => amountType.type === type)?.label || "";

  const sortyByName = (a: Category, b: Category) =>
    a.name.localeCompare(b.name);

  // todo: put sort in pipe
  const categoriesWithUsage: Category[] = pipe(
    filter(nonInflowCategoryWithUsage(categoryAmountType)),
    filter(extraAmountFitler(categoryAmountType))
  )(categories).sort(sortyByName);

  const filteredCategories = categoriesWithUsage.filter(
    notExcludedCategory(excludedCategories)
  );
  const totalAmount = absoluteD1000Number(
    filteredCategories.reduce(
      (total, category) => total + category[categoryAmountType],
      0
    )
  );

  const data = {
    labels: filteredCategories.map((category) => category.name),
    datasets: [
      {
        type: "pie" as const,
        label: getCategoryAmountTypeLabel(categoryAmountType),
        data: filteredCategories.map((category) =>
          absoluteD1000Number(category[categoryAmountType])
        ),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: filteredCategories.map((category) =>
          nameToUniqueColor(category.name)
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
              `${context.chart.data.labels[context.dataIndex]
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
      (category) => category.name === categoryName
    );
    if (!category) return;

    router.push(
      `/budgets/${budgetUuid}/transactions?month=${month}&categoryUuid=${category.uuid}`
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
        selectedAmountTypes={selectedAmountTypes}
      />
      <CategoryPieChartLegend
        categories={categoriesWithUsage}
        excludedCategories={excludedCategories}
        onToggleCategory={toggleCategory}
        amountType={categoryAmountType}
      />
      <Pie data={data} onClick={onClick} ref={chartRef} options={options} />
    </>
  );
};

const AmountTypeToggle = ({
  current,
  onChange,
  selectedAmountTypes,
}: {
  current: CategoryAmountType;
  onChange: (type: CategoryAmountType) => void;
  selectedAmountTypes?: CategoryAmountType[];
}) => {
  const partOfSelectedAmountsFilter = (type: CategoryAmountTypeWithProps) =>
    selectedAmountTypes ? selectedAmountTypes.includes(type.type) : true;
  const isActive = (type: CategoryAmountType) =>
    current === type ? "tab-active" : "";
  return (
    // daisyui boxed tab
    <div className="tabs tabs-boxed">
      {amountTypes.filter(partOfSelectedAmountsFilter).map((type) => (
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
  amountType,
}: {
  categories: Category[];
  excludedCategories: string[];
  onToggleCategory: (categoryName: string) => void;
  amountType: CategoryAmountType;
}) => (
  <div className="flex flex-wrap m-2">
    {categories.map((category) => (
      <div
        className="flex items-center mx-2 tooltip"
        data-tip={formatAmount(category[amountType])}
        key={category.uuid}
      >
        <label className="cursor-pointer">
          <input
            type="checkbox"
            checked={!excludedCategories.includes(category.name)}
            onChange={() => onToggleCategory(category.name)}
          />
          <span
            className="ml-2"
            style={{
              color: nameToUniqueColor(category.name),
            }}
          >
            {category.name}
          </span>
        </label>
      </div>
    ))}
  </div>
);
