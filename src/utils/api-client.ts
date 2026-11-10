interface ApiRequest {
  url: string;
  method: string;
  headers: Readonly<Record<string, string>>;
  body?: unknown;
}

interface JsonResponse {
  response: Response;
  body: unknown;
}

interface ReactNativeFormDataReader {
  getParts: () => readonly unknown[];
}

interface MultipartPart {
  fieldName: string;
  string?: string;
  uri?: string;
  name?: string;
  type?: string;
  sizeBytes?: number;
}

interface MultipartFileLog {
  fieldName: string;
  name: string;
  type: string;
  uri: string;
  sizeBytes: number | null;
  sizeMebibytes: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getApiErrorMessage = (body: unknown, fallbackMessage: string): string =>
  isRecord(body) && typeof body.message === "string" && body.message.trim()
    ? body.message
    : fallbackMessage;

export const isApiErrorResponse = (body: unknown): boolean =>
  isRecord(body) && body.status === "error";

const isReactNativeFormDataReader = (
  value: unknown,
): value is ReactNativeFormDataReader =>
  isRecord(value) && typeof value.getParts === "function";

const getOptionalString = (
  record: Readonly<Record<string, unknown>>,
  key: string,
): string | undefined =>
  typeof record[key] === "string" ? record[key] : undefined;

const getOptionalNumber = (
  record: Readonly<Record<string, unknown>>,
  key: string,
): number | undefined =>
  typeof record[key] === "number" ? record[key] : undefined;

const toMultipartPart = (value: unknown): MultipartPart | null => {
  if (!isRecord(value)) {
    return null;
  }

  const fieldName = getOptionalString(value, "fieldName");
  if (!fieldName) {
    return null;
  }

  return {
    fieldName,
    string: getOptionalString(value, "string"),
    uri: getOptionalString(value, "uri"),
    name: getOptionalString(value, "name"),
    type: getOptionalString(value, "type"),
    sizeBytes: getOptionalNumber(value, "sizeBytes"),
  };
};

const quoteShellValue = (value: string): string =>
  `'${value.replace(/'/g, "'\\''")}'`;

const getCurlFilePath = (uri: string): string => {
  if (!uri.startsWith("file://")) {
    return uri;
  }

  try {
    return decodeURIComponent(uri.slice("file://".length));
  } catch {
    return uri.slice("file://".length);
  }
};

const getMultipartArguments = (body: FormData): string[] => {
  if (!isReactNativeFormDataReader(body)) {
    return [];
  }

  return body.getParts().flatMap((value) => {
    const part = toMultipartPart(value);
    if (!part) {
      return [];
    }

    if (part.string !== undefined) {
      return [`--form ${quoteShellValue(`${part.fieldName}=${part.string}`)}`];
    }

    if (!part.uri) {
      return [];
    }

    const typeParameter = part.type ? `;type=${part.type}` : "";
    const nameParameter = part.name ? `;filename=${part.name}` : "";
    const fileValue = `${part.fieldName}=@${getCurlFilePath(part.uri)}${typeParameter}${nameParameter}`;
    return [`--form ${quoteShellValue(fileValue)}`];
  });
};

const getMultipartFileLogs = (body: unknown): MultipartFileLog[] => {
  if (!(body instanceof FormData) || !isReactNativeFormDataReader(body)) {
    return [];
  }

  return body.getParts().flatMap((value) => {
    const part = toMultipartPart(value);
    if (!part?.uri) {
      return [];
    }

    return [{
      fieldName: part.fieldName,
      name: part.name ?? "Unnamed file",
      type: part.type ?? "application/octet-stream",
      uri: part.uri,
      sizeBytes: part.sizeBytes ?? null,
      sizeMebibytes:
        part.sizeBytes === undefined
          ? null
          : Number((part.sizeBytes / (1024 * 1024)).toFixed(2)),
    }];
  });
};

const getBodyArguments = (body: unknown): string[] => {
  if (body === undefined) {
    return [];
  }

  if (body instanceof FormData) {
    return getMultipartArguments(body);
  }

  const serializedBody = JSON.stringify(body);
  return serializedBody === undefined
    ? []
    : [`--data-raw ${quoteShellValue(serializedBody)}`];
};

const buildCurlCommand = ({ url, method, headers, body }: ApiRequest): string => {
  const argumentsList = [
    `--request ${quoteShellValue(method.toUpperCase())}`,
    `--url ${quoteShellValue(url)}`,
    ...Object.entries(headers).map(
      ([name, value]) => `--header ${quoteShellValue(`${name}: ${value}`)}`,
    ),
    ...getBodyArguments(body),
  ];

  return `curl \\\n  ${argumentsList.join(" \\\n  ")}`;
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  const responseText = await response.text();
  if (!responseText) {
    return null;
  }

  try {
    const responseBody: unknown = JSON.parse(responseText);
    if (typeof responseBody !== "string") {
      return responseBody;
    }

    try {
      const nestedResponseBody: unknown = JSON.parse(responseBody);
      return nestedResponseBody;
    } catch {
      return responseBody;
    }
  } catch {
    return responseText;
  }
};

const SENSITIVE_KEYS = new Set(["authorization", "password", "mpin", "iv", "oldpassword", "newpassword", "oldmpin", "newmpin", "otp", "resettoken"]);

const redactHeaders = (headers: Readonly<Record<string, string>>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name, SENSITIVE_KEYS.has(name.toLowerCase()) ? "[redacted]" : value]),
  );

const redactBody = (body: unknown): unknown => {
  if (Array.isArray(body)) return body.map(redactBody);
  if (!isRecord(body)) return body;
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) || key.toLowerCase().endsWith("iv") ? "[redacted]" : redactBody(value),
    ]),
  );
};

const sanitizeRequest = (request: ApiRequest): ApiRequest => ({
  ...request,
  headers: redactHeaders(request.headers),
  body: request.body instanceof FormData ? request.body : redactBody(request.body),
});

const logRequest = (request: ApiRequest): void => {
  const { url, method, headers, body } = sanitizeRequest(request);
  if (__DEV__) {
    const multipartFiles = getMultipartFileLogs(body);
    console.log(`[API Request] ${method} ${url}`, {
      headers,
      body,
    });
    if (multipartFiles.length > 0) {
      console.log(`[API Files] ${method} ${url}`, multipartFiles);
    }
    console.log(`[API cURL] ${method} ${url}\n${buildCurlCommand({
      url,
      method,
      headers,
      body,
    })}`);
  }
};

const logResponse = ({
  request,
  response,
  body,
  durationMilliseconds,
}: {
  request: ApiRequest;
  response: Response;
  body: unknown;
  durationMilliseconds: number;
}): void => {
  if (__DEV__) {
    console.log(`[API Response] ${request.method} ${request.url}`, {
      status: response.status,
      durationMilliseconds,
      body,
    });
  }
};

const logNetworkError = ({
  request,
  error,
}: {
  request: ApiRequest;
  error: unknown;
}): void => {
  if (__DEV__) {
    console.log(`[API Network Error] ${request.method} ${request.url}`, {
      message: error instanceof Error ? error.message : "Unknown network error",
    });
  }
};

interface RequestExecution {
  request: ApiRequest;
  body?: BodyInit;
}

const executeRequest = async ({
  request,
  body: requestBody,
}: RequestExecution): Promise<JsonResponse> => {
  const startedAt = Date.now();
  logRequest(request);

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: requestBody,
    });
    const body = await readResponseBody(response);
    logResponse({
      request,
      response,
      body,
      durationMilliseconds: Date.now() - startedAt,
    });
    return { response, body };
  } catch (error: unknown) {
    logNetworkError({ request, error });
    throw error;
  }
};

export const executeJsonRequest = async (
  request: ApiRequest,
): Promise<JsonResponse> =>
  executeRequest({
    request,
    body:
      request.body === undefined ? undefined : JSON.stringify(request.body),
  });

export const executeMultipartRequest = async (
  request: ApiRequest & { body: FormData },
): Promise<JsonResponse> => executeRequest({ request, body: request.body });
