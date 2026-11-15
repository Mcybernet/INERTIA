import { loadHistory } from "./history";

/** Loader data client-side (tanpa API route, aman untuk static export). */
export { loadPoolSnapshot as getPoolSnapshot } from "./pool";
export { loadHolders as getHolders } from "./holders";

export function getHistory(force = false) {
  return loadHistory(60, force);
}
