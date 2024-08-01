export const overrideConsoleLog = (): void => {
  const originalLog = console.log;

  console.log = (...args: any[]): void => {
    const timestamp = new Date().toISOString();
    originalLog.apply(console, [timestamp, ...args]);
  };
};
