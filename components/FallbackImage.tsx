import { useState } from "react";
import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from "react-native";

type Props = {
  source: ImageSourcePropType;
  fallback: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
};

/**
 * FallbackImage – hiển thị ảnh từ `source`, tự động chuyển sang `fallback`
 * nếu ảnh không tải được (network lỗi, URL không hợp lệ, timeout, v.v.).
 */
export function FallbackImage({ source, fallback, style, resizeMode }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={failed ? fallback : source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
