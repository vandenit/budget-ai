"use client";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { MonthlySpendingData } from "./util";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Chart.js Line Chart",
    },
  },
};

type Props = {
  spendingData: MonthlySpendingData[];
};

export const MonthlySpendingChart = ({ spendingData }: Props) => {
  const data = {
    labels: spendingData.map((data) => data.dayOfMonth),
    datasets: [
      {
        label: "Dataset 1",
        data: spendingData.map((data) => data.spent),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };
  console.log(JSON.stringify(data));
  return <Line options={options} data={data} />;
};
