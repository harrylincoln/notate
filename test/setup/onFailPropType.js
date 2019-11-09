const originalConsoleError = console.error;

console.error = message => {
  if (/(Failed prop type)/.test(message)) {
      // jest issue with unhandled func prop type
      return;
  }
  originalConsoleError(message);
};