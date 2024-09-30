let isConsoleLogOverridden = false;

export const overrideConsoleLog = (): void => {
  if (isConsoleLogOverridden) {
    return;
  }
  const originalLog = console.log;

  console.log = (...args: any[]): void => {
    const timestamp = new Date().toISOString();
    originalLog.apply(console, [timestamp, ...args]);
  };
  isConsoleLogOverridden = true;
};
