import { API_BASE_URL } from "@/src/config/env";
import { createAuthenticatedHeaders } from "@/src/features/auth/data/authenticated-headers";
import type {
  AuthRoleComponent,
  AuthSession,
  ChangeMpinInput,
  ChangePasswordInput,
  CredentialsInput,
  LoginRequestDto,
  LoginResponseDto,
  LoginRoleComponentDto,
  OtpPurpose,
  ResetPasswordInput,
  SetMpinInput,
} from "@/src/features/auth/domain/auth.types";
import {
  executeJsonRequest,
  getApiErrorMessage,
  isApiErrorResponse,
} from "@/src/utils/api-client";
import { encryptSecret } from "@/src/utils/secret-crypto";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNullableString = (value: unknown): value is string | null =>
  typeof value === "string" || value === null;

function isLoginRoleComponentDto(value: unknown): value is LoginRoleComponentDto {
  if (!isRecord(value) || !Array.isArray(value.children)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.componentName === "string" &&
    typeof value.moduleName === "string" &&
    typeof value.componentType === "string" &&
    isNullableString(value.description) &&
    isNullableString(value.routeLink) &&
    isNullableString(value.mobileRouteLink) &&
    isNullableString(value.icon) &&
    isNullableString(value.mobileIcon) &&
    typeof value.orderNo === "number" &&
    isStringArray(value.permission) &&
    typeof value.hasAccess === "boolean" &&
    value.children.every(isLoginRoleComponentDto)
  );
}

const isLoginResponseDto = (value: unknown): value is LoginResponseDto => {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.userData)) {
    return false;
  }
  const { data } = value;
  const userData = data.userData as Record<string, unknown>;
  const defaultRole = userData.defaultRole;
  if (!isRecord(defaultRole)) {
    return false;
  }
  const hasValidEmployee =
    userData.employee === null ||
    userData.employee === undefined ||
    (isRecord(userData.employee) && typeof userData.employee.employeeCode === "string");

  return (
    typeof value.status === "string" &&
    typeof data.token === "string" &&
    typeof userData.id === "string" &&
    typeof userData.clientId === "number" &&
    hasValidEmployee &&
    typeof userData.name === "string" &&
    typeof userData.userId === "string" &&
    typeof userData.defaultCompanyId === "string" &&
    typeof userData.defaultRoleId === "string" &&
    Array.isArray(defaultRole.roleComponent) &&
    defaultRole.roleComponent.every(isLoginRoleComponentDto)
  );
};

const mapRoleComponent = (component: LoginRoleComponentDto): AuthRoleComponent => ({
  id: component.id,
  componentName: component.componentName,
  moduleName: component.moduleName,
  componentType: component.componentType,
  description: component.description,
  routeLink: component.routeLink,
  mobileRouteLink: component.mobileRouteLink,
  icon: component.icon,
  mobileIcon: component.mobileIcon,
  orderNo: component.orderNo,
  permissions: component.permission,
  hasAccess: component.hasAccess,
  children: component.children.map(mapRoleComponent),
});

const mapLoginResponseToSession = (response: LoginResponseDto): AuthSession => {
  const { userData } = response.data;
  return {
    accessToken: response.data.token,
    roleComponents: userData.defaultRole.roleComponent.map(mapRoleComponent),
    user: {
      id: userData.id,
      clientId: userData.clientId,
      clientName: userData.clientName ?? userData.defaultCompanyName,
      employeeCode: userData.employee?.employeeCode ?? null,
      displayName: userData.name,
      name: userData.name,
      email: userData.email ?? "",
      mobile: userData.mobile ?? "",
      userId: userData.userId,
      hasMpin: Boolean(userData.hasMpin),
      isAdmin: Boolean(userData.isAdmin),
      lastLogin: userData.lastLogin ?? "",
      roleId: userData.defaultRoleId,
      roleName: userData.defaultRoleName ?? "",
      branchId: userData.defaultBranchId ?? null,
      profilePicPath: typeof userData.profilePic === "string" && userData.profilePic ? userData.profilePic : null,
      company: [{ id: userData.defaultCompanyId, name: userData.defaultCompanyName }],
    },
  };
};

/** The API reports the per-user session cap inside the login body. */
const isMaxSessionsResponse = (body: unknown): boolean => {
  if (!isRecord(body) || !isRecord(body.data)) return false;
  const { data } = body;
  return (
    Boolean(data.maxSessionsReached || data.sessionLimitExceeded) ||
    (Array.isArray(data.activeSessions) && typeof data.sessionActionToken === "string")
  );
};

const failWithMessage = (body: unknown, fallbackMessage: string): never => {
  throw new Error(getApiErrorMessage(body, fallbackMessage));
};

export class AuthRepository {
  async loginWithCredentials(input: CredentialsInput): Promise<AuthSession> {
    const { cipher, iv } = encryptSecret(input.password);
    return this.login({ userId: input.userId, password: cipher, iv, detail: true });
  }

  async loginWithMpin(userId: string, mpin: string): Promise<AuthSession> {
    return this.login({ userId, mpin, detail: true });
  }

  private async login(requestBody: LoginRequestDto): Promise<AuthSession> {
    const { response, body } = await executeJsonRequest({
      url: `${API_BASE_URL}/auth/login`,
      method: "POST",
      headers: JSON_HEADERS,
      body: requestBody,
    });

    if (isMaxSessionsResponse(body)) {
      throw new Error(
        getApiErrorMessage(
          body,
          "Maximum active sessions reached. Sign out from another device and try again.",
        ),
      );
    }
    if (!response.ok || isApiErrorResponse(body)) {
      failWithMessage(body, "Sign-in could not be completed.");
    }
    if (!isLoginResponseDto(body)) {
      throw new Error("The login response was incomplete.");
    }
    return mapLoginResponseToSession(body);
  }

  async logout(session: AuthSession): Promise<void> {
    await executeJsonRequest({
      url: `${API_BASE_URL}/auth/logout`,
      method: "POST",
      headers: { ...createAuthenticatedHeaders(session), ...JSON_HEADERS },
      body: {},
    });
  }

  async changePassword(session: AuthSession, input: ChangePasswordInput): Promise<void> {
    const oldSecret = encryptSecret(input.oldPassword);
    const newSecret = encryptSecret(input.newPassword);
    await this.send(
      session,
      "/user/change-password",
      {
        oldPassword: oldSecret.cipher,
        oldPasswordIv: oldSecret.iv,
        newPassword: newSecret.cipher,
        newPasswordIv: newSecret.iv,
      },
      "Password could not be changed.",
    );
  }

  async setMpin(session: AuthSession, input: SetMpinInput): Promise<void> {
    const secret = encryptSecret(input.mpin);
    await this.send(
      session,
      "/user/set-mpin",
      { mobile: input.mobile, mpin: secret.cipher, iv: secret.iv },
      "MPIN could not be set.",
    );
  }

  async changeMpin(session: AuthSession, input: ChangeMpinInput): Promise<void> {
    const oldSecret = encryptSecret(input.oldMpin);
    const newSecret = encryptSecret(input.newMpin);
    await this.send(
      session,
      "/user/change-mpin",
      {
        oldMpin: oldSecret.cipher,
        oldMpinIv: oldSecret.iv,
        newMpin: newSecret.cipher,
        newMpinIv: newSecret.iv,
      },
      "MPIN could not be changed.",
    );
  }

  async requestOtp(mobile: string, purpose: OtpPurpose): Promise<void> {
    await this.sendPublic("/public/otpGenerate", { mobile, purpose }, "OTP could not be sent.");
  }

  /** Returns the short-lived reset token needed to set the new password. */
  async verifyOtp(mobile: string, otp: string, purpose: OtpPurpose): Promise<string> {
    const body = await this.sendPublic(
      "/public/verify-otp",
      { mobile, otp, purpose },
      "The OTP could not be verified.",
    );
    const token = isRecord(body) && isRecord(body.data) ? body.data.resetToken : undefined;
    if (typeof token !== "string" || !token) {
      throw new Error("The OTP could not be verified.");
    }
    return token;
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const secret = encryptSecret(input.newPassword);
    await this.sendPublic(
      "/public/forgot-password",
      {
        mobile: input.mobile,
        otp: input.otp,
        resetToken: input.resetToken,
        password: secret.cipher,
        iv: secret.iv,
        purpose: "FORGOT_PASSWORD",
      },
      "Password could not be reset.",
    );
  }

  private async send(
    session: AuthSession,
    path: string,
    requestBody: Record<string, unknown>,
    fallbackMessage: string,
  ): Promise<void> {
    const { response, body } = await executeJsonRequest({
      url: `${API_BASE_URL}${path}`,
      method: "POST",
      headers: { ...createAuthenticatedHeaders(session), ...JSON_HEADERS },
      body: requestBody,
    });
    if (!response.ok || isApiErrorResponse(body)) {
      failWithMessage(body, fallbackMessage);
    }
  }

  private async sendPublic(
    path: string,
    requestBody: Record<string, unknown>,
    fallbackMessage: string,
  ): Promise<unknown> {
    const { response, body } = await executeJsonRequest({
      url: `${API_BASE_URL}${path}`,
      method: "POST",
      headers: JSON_HEADERS,
      body: requestBody,
    });
    if (!response.ok || isApiErrorResponse(body)) {
      failWithMessage(body, fallbackMessage);
    }
    return body;
  }
}

export const authRepository = new AuthRepository();
