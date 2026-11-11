export function formatSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    message: message || "Operation completed successfully",
    data,
  };
}

export function formatErrorResponse(message: string, error?: any) {
  return {
    success: false,
    message,
    error: error || null,
  };
}

