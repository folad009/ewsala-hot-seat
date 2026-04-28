export const SERVICE_NAME = "Eswala Trivia";
export const DAILY_SUBSCRIPTION_FEE_NAIRA = 150;
export const DEFAULT_SHORTCODE = process.env.MTN_SHORTCODE ?? "35123";
export const DEFAULT_SUBSCRIBE_KEYWORD =
  process.env.MTN_SUBSCRIBE_KEYWORD ?? "TRIVIA";
export const DEFAULT_OPT_OUT_KEYWORD = process.env.MTN_OPT_OUT_KEYWORD ?? "STOP";

export function formatNaira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}
