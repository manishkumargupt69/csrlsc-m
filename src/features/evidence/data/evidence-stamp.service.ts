import * as Location from "expo-location";
import {
  getImageMetaData,
  getVideoMetaData,
} from "react-native-compressor";
import ReactNativeExpoWatermark from "react-native-expo-watermark";
import type { WatermarkConfig } from "react-native-expo-watermark";

const MINIMUM_STAMP_FONT_SIZE = 16;
const STAMP_FONT_WIDTH_RATIO = 0.035;
const STAMP_MARGIN_WIDTH_RATIO = 0.04;
const STAMP_LINE_HEIGHT_RATIO = 1.3;
const STAMP_BOTTOM_SPACE_RATIO = 1.2;
const SHADOW_OFFSET_RATIO = 0.08;
const CHARACTER_WIDTH_RATIO = 0.58;
const LOCATION_UNAVAILABLE = "Location unavailable";

interface StampEvidenceOptions {
  kind: "photo" | "video";
  sourceUri: string;
  capturedAt: string;
  addressLines: readonly string[];
  onProgress?: (progress: number) => void;
}

interface MediaDimensions {
  width: number;
  height: number;
}

const POSITION_TIMEOUT_MS = 12_000;
const COORDINATE_DECIMALS = 5;

/** Resolves to null instead of hanging when the phone cannot get a position quickly (indoors, GPS off). */
const getPosition = async (): Promise<Location.LocationObject | null> => {
  const fresh = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), POSITION_TIMEOUT_MS));
  const position = await Promise.race([fresh, timeout]).catch(() => null);
  // A recent fix is better than no location at all.
  return position ?? (await Location.getLastKnownPositionAsync().catch(() => null));
};

const describeAddress = async (coordinates: Location.LocationObjectCoords): Promise<string[]> => {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinates);
    if (!address) return [];
    const street = [address.streetNumber, address.street ?? address.name].filter(Boolean).join(" ");
    const cityAndState = [address.city ?? address.district, address.region ?? address.subregion].filter(Boolean).join(", ");
    return [street, cityAndState].filter(Boolean);
  } catch {
    // The address lookup needs a network; the coordinates below still say where this was taken.
    return [];
  }
};

/**
 * What is printed on a photo or video: the address (when it can be looked up) and always the GPS coordinates,
 * so a stamp still proves the place when the phone is offline. "Location unavailable" only when there is no fix.
 */
export const getEvidenceAddressLines = async (): Promise<string[]> => {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return [LOCATION_UNAVAILABLE];
    const position = await getPosition();
    if (!position) return [LOCATION_UNAVAILABLE];
    const { latitude, longitude } = position.coords;
    const coordinates = latitude.toFixed(COORDINATE_DECIMALS) + ", " + longitude.toFixed(COORDINATE_DECIMALS);
    return [...(await describeAddress(position.coords)), coordinates];
  } catch {
    return [LOCATION_UNAVAILABLE];
  }
};

const getMediaDimensions = async (
  kind: StampEvidenceOptions["kind"],
  sourceUri: string,
): Promise<MediaDimensions> => {
  if (kind === "video") {
    const metadata = await getVideoMetaData(sourceUri);
    return { width: metadata.width, height: metadata.height };
  }
  const metadata = await getImageMetaData(sourceUri);
  return { width: metadata.ImageWidth, height: metadata.ImageHeight };
};

const fitLine = (text: string, dimensions: {
  width: number;
  fontSize: number;
  margin: number;
}): string => {
  const maximumLength = Math.max(
    12,
    Math.floor((dimensions.width - dimensions.margin * 2)
      / (dimensions.fontSize * CHARACTER_WIDTH_RATIO)),
  );
  return text.length <= maximumLength
    ? text
    : `${text.slice(0, maximumLength - 3).trimEnd()}...`;
};

const createStampConfig = (
  lines: readonly string[],
  dimensions: MediaDimensions,
): WatermarkConfig => {
  const fontSize = Math.max(
    MINIMUM_STAMP_FONT_SIZE,
    Math.round(dimensions.width * STAMP_FONT_WIDTH_RATIO),
  );
  const margin = Math.round(dimensions.width * STAMP_MARGIN_WIDTH_RATIO);
  const lineHeight = Math.round(fontSize * STAMP_LINE_HEIGHT_RATIO);
  const stampHeight = lines.length * lineHeight
    + Math.round(fontSize * STAMP_BOTTOM_SPACE_RATIO);
  const shadowOffset = Math.max(1, Math.round(fontSize * SHADOW_OFFSET_RATIO));
  return {
    quality: "medium",
    layers: [{
      texts: lines.flatMap((line, index) => {
        const text = fitLine(line, { width: dimensions.width, fontSize, margin });
        const offsetY = index * lineHeight;
        return [
          { text, offsetX: shadowOffset, offsetY: offsetY + shadowOffset, fontSize, color: "#1B1D1B", opacity: 0.9 },
          { text, offsetX: 0, offsetY, fontSize, color: "#FFFFFF" },
        ];
      }),
      layout: {
        mode: "fixed",
        positions: [{
          x: margin / dimensions.width,
          y: Math.max(0, 1 - stampHeight / dimensions.height),
        }],
      },
    }],
  };
};

export const stampEvidenceMedia = async ({
  kind,
  sourceUri,
  capturedAt,
  addressLines,
  onProgress,
}: StampEvidenceOptions): Promise<string> => {
  // Date and time of day, in the phone's own time zone, e.g. "08 Nov 2026, 11:47 pm".
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(capturedAt));
  const dimensions = await getMediaDimensions(kind, sourceUri);
  const config = createStampConfig([...addressLines, date], dimensions);
  if (kind === "photo") {
    return ReactNativeExpoWatermark.composeImageWatermark(sourceUri, config);
  }
  return ReactNativeExpoWatermark.exportVideoWithWatermark(sourceUri, config, {
    onProgress,
  });
};

export const deleteStampedEvidenceFile = async (uri: string): Promise<void> => {
  await ReactNativeExpoWatermark.deleteWatermarkFile(uri);
};
