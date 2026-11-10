import type { AuthSession } from "@/src/features/auth/domain/auth.types";

export const createAuthenticatedHeaders = (
  session: AuthSession,
): Record<string, string> => {
  const company = session.user.company[0];
  if (!company) {
    throw new Error("No company is assigned to this user.");
  }

  const headers: Record<string, string> = {
    Authorization: session.accessToken,
    company: company.id,
    role: session.user.roleId,
  };
  if (session.user.branchId) {
    headers.branch = session.user.branchId;
  }

  return headers;
};
