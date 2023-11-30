"use client";
import React, { MouseEvent, useRef } from "react";
import type { InteractionItem } from "chart.js";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from "chart.js";
import { useRouter } from "next/navigation";
import { Chart, getElementAtEvent } from "react-chartjs-2";
import { MonthlySpendingData } from "./util";

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip
);

export const options = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};
type Props = {
  spendingData: MonthlySpendingData[];
  categoryId: string;
  month: string;
  budgetId: string;
};

export const MonthlySpendingChart = ({
  spendingData,
  month,
  categoryId,
  budgetId,
}: Props) => {
  const router = useRouter();

  const data = {
    labels: spendingData.map((data) => data.dayOfMonth),
    datasets: [
      {
        type: "bar" as const,
        label: "Dataset 1",
        data: spendingData.map((data) => data.spent),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  const printDatasetAtEvent = (dataset: InteractionItem[]) => {
    if (!dataset.length) return;

    const datasetIndex = dataset[0].datasetIndex;

    console.log(data.datasets[datasetIndex].label);
  };

  type Props = {
    spendingData: MonthlySpendingData[];
  };

  // see https://react-chartjs-2.js.org/examples/chart-events for handling more data
  const handleChartEvent = (element: InteractionItem[]) => {
    if (!element.length) return;

    const { index } = element[0];
    const { labels } = data;
    const dayOfMonth = labels[index];
    // todo: should parent be client component that handles this?
    router.push(
      `/budgets/${budgetId}/transactions?month=${month}&dayOfMonth=${dayOfMonth}&categoryId=${categoryId}`
    );
  };

  const chartRef = useRef<ChartJS>(null);

  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const { current: chart } = chartRef;
    if (!chart) {
      return;
    }
    handleChartEvent(getElementAtEvent(chart, event));
  };

  return (
    <Chart
      type="bar"
      options={options}
      data={data}
      onClick={onClick}
      ref={chartRef}
    />
  );
};
