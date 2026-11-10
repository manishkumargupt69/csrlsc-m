import type { ViewState } from "@/src/types/view-state";

interface QueryLike<T> {
  data: T | undefined;
  isError: boolean;
  isPending: boolean;
  status: "pending" | "error" | "success";
  fetchStatus: "fetching" | "paused" | "idle";
}

/** Maps a react-query result onto the idle/loading/empty/error/success states the UI renders. */
export const toViewState = <T>(
  query: QueryLike<T>,
  options: { isEnabled: boolean; isEmpty: (data: T) => boolean; errorMessage: string },
): ViewState<T> => {
  if (!options.isEnabled || (query.fetchStatus === "idle" && query.status === "pending")) {
    return { status: "idle" };
  }
  if (query.isPending) return { status: "loading" };
  if (query.isError || query.data === undefined) {
    return { status: "error", message: options.errorMessage };
  }
  if (options.isEmpty(query.data)) return { status: "empty" };
  return { status: "success", data: query.data };
};
