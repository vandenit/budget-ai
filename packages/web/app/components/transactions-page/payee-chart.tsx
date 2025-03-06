import { PayeeWithActivity } from "common-ts";
import { PayeeActivityChart } from "../charts/payee-activity-chart";

export const PayeeChart = ({
    payeesWithActivities
}: {
    payeesWithActivities: PayeeWithActivity[];
}) => {
    return (
        <PayeeActivityChart payeesWithActivities={payeesWithActivities.sort(
            (a, b) => b.activity - a.activity
        )} />
    );
}