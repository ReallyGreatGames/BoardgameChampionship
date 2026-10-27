const INVALID_PIN_ERROR_NAME = "InvalidPinError";

export class InvalidPinError extends Error {
  constructor() {
    super("Invalid PIN");
    this.name = INVALID_PIN_ERROR_NAME;
  }
}

export function getPinLoginErrorPresentation(error: unknown) {
  if (error instanceof InvalidPinError) {
    return {
      title: "Invalid PIN",
      message: error.message,
    };
  }

  return {
    title: "Network error",
    message: "Please check your internet connection and try again.",
  };
}
