import { formatAmount } from "@/packages/common-ts/dist";

export const TransactionAmount = ({
    amount,
}: {
    amount: number;
}) => {
    return (
        <div
            className={`font-bold text-lg ${amount >= 0 ? "text-green-500 dark:text-green-200" : "text-red-500 dark:text-red-300"
                }  `}
        >
            {formatAmount(amount)}
        </div>
    );
};
