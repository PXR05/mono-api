export function responseSuccess({
  success,
  message,
  data,
}: {
  success: boolean;
  message: string;
  data?: any;
}) {
  return {
    success,
    message,
    data,
  };
}
