import { percentageToStatusClass } from "../utils";

type Props = {
  percentage: number;
  width?: number;
};

const Progress = ({ percentage, width }: Props) => (
  <progress
    className={`progress progress-${percentageToStatusClass(percentage)} w-10`}
    value={percentage}
    max="100"
  ></progress>
);

export default Progress;
