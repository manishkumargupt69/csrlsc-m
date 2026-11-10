export type AuthMode = "credentials" | "mpin";

export interface CredentialsInput {
  userId: string;
  password: string;
}

export type RememberedCredentials = CredentialsInput;

export interface AuthCompany {
  id: string;
  name: string;
}

export interface AuthenticatedUser {
  id: string;
  clientId?: number;
  clientName: string;
  employeeCode: string | null;
  displayName: string;
  name: string;
  email: string;
  mobile: string;
  userId: string;
  hasMpin: boolean;
  isAdmin: boolean;
  lastLogin: string;
  roleId: string;
  roleName: string;
  branchId: string | null;
  /** Stored path of the profile picture; turned into a link by the profile-photo feature. */
  profilePicPath?: string | null;
  company: readonly AuthCompany[];
}

export interface AuthRoleComponent {
  id: string;
  componentName: string;
  moduleName: string;
  componentType: string;
  description: string | null;
  routeLink: string | null;
  mobileRouteLink: string | null;
  icon: string | null;
  mobileIcon: string | null;
  orderNo: number;
  permissions: readonly string[];
  hasAccess: boolean;
  children: readonly AuthRoleComponent[];
}

export interface AuthSession {
  accessToken: string;
  roleComponents: readonly AuthRoleComponent[];
  user: AuthenticatedUser;
}

/** Login with a password sends ciphertext plus IV; login with an MPIN sends the plain 4 digits. */
export type LoginRequestDto =
  | { userId: string; password: string; iv: string; detail: true; mpin?: never }
  | { userId: string; mpin: string; detail: true; password?: never; iv?: never };

export interface LoginRoleComponentDto {
  id: string;
  componentName: string;
  moduleName: string;
  componentType: string;
  description: string | null;
  routeLink: string | null;
  mobileRouteLink: string | null;
  icon: string | null;
  mobileIcon: string | null;
  orderNo: number;
  permission: string[];
  hasAccess: boolean;
  children: LoginRoleComponentDto[];
}

export interface LoginUserDataDto {
  id: string;
  clientId: number;
  clientName: string;
  employee: {
    employeeCode: string;
  } | null;
  name: string;
  email: string;
  mobile: string;
  userId: string;
  hasMpin: boolean;
  isAdmin: boolean;
  lastLogin: string;
  defaultCompanyId: string;
  defaultCompanyName: string;
  defaultRoleId: string;
  defaultRoleName: string;
  defaultBranchId: string | null;
  profilePic?: string | null;
  defaultRole: {
    roleId: string;
    roleComponent: LoginRoleComponentDto[];
  };
}

export interface LoginResponseDto {
  status: string;
  message: string;
  data: {
    token: string;
    userData: LoginUserDataDto;
  };
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface ChangeMpinInput {
  oldMpin: string;
  newMpin: string;
}

export interface SetMpinInput {
  mobile: string;
  mpin: string;
}

export type OtpPurpose = "FORGOT_PASSWORD" | "FORGOT_MPIN";

export interface ResetPasswordInput {
  mobile: string;
  otp: string;
  resetToken: string;
  newPassword: string;
}
