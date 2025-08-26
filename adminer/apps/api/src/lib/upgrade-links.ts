export function getUpgradeUrl(plan: "free" | "pro" | "enterprise") {
  if (plan === "free") return process.env.DODO_CHECKOUT_PRO_URL;
  if (plan === "pro") return process.env.DODO_CHECKOUT_ENTERPRISE_URL;
  return undefined; // enterprise is top tier
} 