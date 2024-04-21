// todo: this is needed to dynamically have colors for
// the progress bars. Check how this can be avoided
const HiddenProgressBars = () => (
  <>
    <progress
      className="progress progress-info hidden"
      value="0"
      max="100"
    ></progress>
    <progress
      className="progress progress-warning hidden"
      value="0"
      max="100"
    ></progress>
    <progress
      className="progress progress-error hidden"
      value="0"
      max="100"
    ></progress>
  </>
);

export default HiddenProgressBars;
