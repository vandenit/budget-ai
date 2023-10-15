import { percentageToStatusClass } from "../utils/styling";

type Props = {
  percentage: number;
};

const Progress = ({ percentage }: Props) => (
  <progress
    className={`progress progress-${percentageToStatusClass(percentage)} w-56`}
    value={percentage}
    max="100"
  ></progress>
);

export default Progress;
