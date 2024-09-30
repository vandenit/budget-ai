"use client";
import React, { useRef, useState, MouseEvent } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

const MIN_PERCENTAGE_TO_DISPLAY = 4;

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

import { chartFormatter, isOnMobileDevice, nameToUniqueColor, valueToPercentageOfTotal } from "./util";
import { Category, isInflowCategory, PayeeWithActivity } from "common-ts";
import { absoluteD1000Number, formatAmount } from "common-ts";

type Props = {
  payeesWithActivities: PayeeWithActivity[];
};

const options = {
  plugins: {
    legend: {
      display: false,
    },
  },
};

export const PayeeActivityChart = ({
  payeesWithActivities
}: Props) => {

  // payees to exclude from pie chart state
  const [excludedPayees, setExcludedPayees] = useState<string[]>([]);
  const nonExcludedPayees = payeesWithActivities.filter(
    (payee) => !excludedPayees.includes(payee.payeeName)
  );
  const totalAmount = absoluteD1000Number(
    nonExcludedPayees.reduce(
      (total, PayeeWithActivity) => total + PayeeWithActivity.activity,
      0
    )
  );

  const data = {
    labels: nonExcludedPayees.map((payee) => payee.payeeName),
    datasets: [
      {
        type: "pie" as const,
        label: "Payee Activity",
        data: nonExcludedPayees.map((payeeWithActivity) =>
          absoluteD1000Number(payeeWithActivity.activity)
        ),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: nonExcludedPayees.map((payeeWithActivity) =>
          nameToUniqueColor(payeeWithActivity.payeeName)
        ),
        datalabels: {
          //black
          color: "#000000",
          formatter: chartFormatter(totalAmount, MIN_PERCENTAGE_TO_DISPLAY),
        },
      },
    ],
  };

  const chartRef = useRef();

  const togglePayee = (payeeName: string) => {
    setExcludedPayees((excludedPayees) =>
      excludedPayees.includes(payeeName)
        ? excludedPayees.filter((payee) => payee !== payeeName)
        : [...excludedPayees, payeeName]
    );
  };

  return (
    <>
      <PayeeChartLegend
        payeesWithActivity={payeesWithActivities}
        excludedPayees={excludedPayees}
        onTogglePayee={togglePayee}
      />
      <Pie data={data} ref={chartRef} options={options} />
    </>
  );
};


const PayeeChartLegend = ({
  payeesWithActivity,
  excludedPayees,
  onTogglePayee,
}: {
  payeesWithActivity: PayeeWithActivity[];
  excludedPayees: string[];
  onTogglePayee: (payeeName: string) => void;
}) => (
  <div className="flex flex-wrap m-2">
    {payeesWithActivity.map((payee) => (
      <div
        className="flex items-center mx-2 tooltip"
        data-tip={formatAmount(payee.activity)}
        key={payee.payeeName}
      >
        <label className="cursor-pointer">
          <input
            type="checkbox"
            checked={!excludedPayees.includes(payee.payeeName)}
            onChange={() => onTogglePayee(payee.payeeName)}
          />
          <span
            className="ml-2"
            style={{
              color: nameToUniqueColor(payee.payeeName),
            }}
          >
            {payee.payeeName}
          </span>
        </label>
      </div>
    ))}
  </div>
);
