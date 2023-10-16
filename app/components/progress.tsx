import { percentageToStatusClass } from "../utils/styling";

type Props = {
  percentage: number;
  width?: number;
};

const Progress = ({ percentage, width }: Props) => (
  <progress
    className={`progress progress-${percentageToStatusClass(percentage)} w-${
      width || 56
    }`}
    value={percentage}
    max="100"
  ></progress>
);

export default Progress;
