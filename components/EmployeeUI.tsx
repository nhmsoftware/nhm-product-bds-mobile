import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle, type ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { employeePalette } from "@/libs/employee-theme";
import { appFonts } from "@/libs/typography";
import { useAuth } from "@/services/auth/store";
import { useNotificationState } from "@/services/notifications/provider";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const EMPLOYEE_HEADER_HEIGHT = 60;

type EmployeePageProps = PropsWithChildren<{
  title?: string;
  headerTitle?: string;
  subtitle?: string;
  right?: ReactNode;
  back?: () => void;
  backType?: "previous" | "home";
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ComponentProps<typeof SafeAreaView>["edges"];
}>;

type EmployeeButtonProps = PropsWithChildren<{
  title: string;
  icon?: IconName;
  tone?: "red" | "gold" | "green" | "light";
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>;

type EmployeeCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  accent?: "default" | "red" | "gold" | "green";
}>;

export function EmployeePage({
  title,
  headerTitle,
  subtitle,
  right,
  back,
  backType = "previous",
  scroll = true,
  contentStyle,
  edges,
  children
}: EmployeePageProps) {
  const body = (
    <View style={[styles.content, contentStyle]}>
      {title || subtitle ? (
        <View style={styles.pageHeader}>
          {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <EmployeeTopBar back={back} backType={backType} title={headerTitle} right={right} />
      <View style={styles.bodyArea}>
        {scroll ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} style={styles.bodyArea}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </View>
    </SafeAreaView>
  );
}

export function EmployeeTopBar({
  back,
  backType = "previous",
  title,
  right
}: {
  back?: () => void;
  backType?: "previous" | "home";
  title?: string;
  right?: ReactNode;
}) {
  const { session } = useAuth();
  const pathname = usePathname();
  const name = session?.user.fullName || "N";
  const backIcon = backType === "home" ? "home-outline" : "arrow-back";
  const longTitle = title ? title.length > 25 : false;

  return (
    <View style={styles.topBar}>
      {back ? (
        <Pressable accessibilityRole="button" onPress={back} style={styles.backButton}>
          <Ionicons name={backIcon} size={22} color={employeePalette.text} />
        </Pressable>
      ) : (
        <EmployeeAvatarButton label={name} />
      )}
      {title ? (
        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.topTitle, longTitle && styles.topTitleLong]}>
          {title}
        </Text>
      ) : null}
      <View style={styles.topSpacer} />
      {right ?? <EmployeeNotificationButton returnTo={pathname} />}
    </View>
  );
}

export function EmployeeAvatarButton({
  imageSource,
  imageUri,
  label,
  onPress
}: {
  imageSource?: ImageSourcePropType;
  imageUri?: string | null;
  label?: string | null;
  onPress?: () => void;
}) {
  const initial = (label || "N").slice(0, 1).toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress || (() => router.push("/employee/personal-info"))}
      style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.avatarImage} />
      ) : imageSource ? (
        <Image source={imageSource} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{initial}</Text>
      )}
    </Pressable>
  );
}

export function EmployeeNotificationButton({
  color = employeePalette.text,
  returnTo,
  size = 20
}: {
  color?: string;
  returnTo: string;
  size?: number;
}) {
  const { unreadCount } = useNotificationState();
  const showBadge = unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/employee/notifications",
          params: { returnTo }
        })
      }
      style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {showBadge ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function EmployeeCard({ style, accent = "default", children }: EmployeeCardProps) {
  return (
    <View
      style={[
        styles.card,
        accent === "red" && styles.cardRed,
        accent === "gold" && styles.cardGold,
        accent === "green" && styles.cardGreen,
        style
      ]}
    >
      {children}
    </View>
  );
}

export function EmployeeButton({
  title,
  icon,
  tone = "red",
  onPress,
  style,
  children
}: EmployeeButtonProps) {
  const isLight = tone === "light";
  const color =
    tone === "gold"
      ? employeePalette.gold
      : tone === "green"
        ? employeePalette.green
        : tone === "light"
          ? "#ffffff"
          : employeePalette.red;
  const textColor = isLight ? employeePalette.red : "#ffffff";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color, borderColor: isLight ? employeePalette.border : color },
        pressed && styles.pressed,
        style
      ]}
    >
      {children ?? (
        <View style={styles.buttonContent}>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function EmployeeSectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function EmployeeBadge({
  label,
  tone = "red"
}: {
  label: string;
  tone?: "red" | "gold" | "green" | "neutral";
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === "gold" && styles.badgeGold,
        tone === "green" && styles.badgeGreen,
        tone === "neutral" && styles.badgeNeutral
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === "gold" && styles.badgeTextGold,
          tone === "green" && styles.badgeTextGreen,
          tone === "neutral" && styles.badgeTextNeutral
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function EmployeeInputPreview({
  label,
  value,
  icon = "create-outline",
  iconElement,
  multiline
}: {
  label: string;
  value: string;
  icon?: IconName;
  iconElement?: ReactNode;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputPreview, multiline && styles.inputPreviewLarge]}>
        {iconElement ?? <Ionicons name={icon} size={18} color={employeePalette.muted} />}
        <Text style={styles.inputText}>{value}</Text>
      </View>
    </View>
  );
}

export function EmployeeListRow({
  icon,
  title,
  description,
  badge,
  onPress
}: {
  icon: IconName;
  title: string;
  description?: string;
  badge?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      <View style={styles.listIcon}>
        <Ionicons name={icon} size={24} color={employeePalette.muted} />
      </View>
      <View style={styles.listCopy}>
        <Text style={styles.listTitle}>{title}</Text>
        {description ? <Text style={styles.listDescription}>{description}</Text> : null}
      </View>
      {badge ?? <Ionicons name="chevron-forward" size={18} color="#b49e9b" />}
    </Pressable>
  );
}

export function EmployeeMetric({
  value,
  label,
  tone = "red"
}: {
  value: string;
  label: string;
  tone?: "red" | "gold" | "green";
}) {
  const color =
    tone === "gold" ? employeePalette.goldDark : tone === "green" ? employeePalette.green : employeePalette.red;
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  bodyArea: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    overflow: "hidden",
    width: 32
  },
  avatarImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  avatarText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 12
  },
  backButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  notificationButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    position: "relative",
    width: 36
  },
  notificationBadge: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderColor: "#ffffff",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 17,
    justifyContent: "center",
    minWidth: 17,
    paddingHorizontal: 4,
    position: "absolute",
    right: 2,
    top: 2
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 9,
    lineHeight: 11,
    textAlign: "center"
  },
  topSpacer: {
    flex: 1
  },
  topTitle: {
    color: employeePalette.text,
    flexShrink: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 22,
    lineHeight: 28,
    marginLeft: 8
  },
  topTitleLong: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28
  },
  scroll: {
    paddingBottom: 28
  },
  content: {
    gap: 16,
    padding: 20
  },
  pageHeader: {
    gap: 4,
    paddingBottom: 8
  },
  pageTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  pageSubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2
  },
  cardRed: {
    borderColor: "#eadfdf"
  },
  cardGold: {
    borderColor: "rgba(253, 206, 103, 0.3)"
  },
  cardGreen: {
    borderColor: "rgba(30, 142, 62, 0.25)"
  },
  button: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 24
  },
  buttonText: {
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1
  },
  sectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffdad4",
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  badgeGold: {
    backgroundColor: "#fff7df",
    borderColor: "#ffd987",
    borderWidth: 1
  },
  badgeGreen: {
    backgroundColor: "#dff7e9"
  },
  badgeNeutral: {
    backgroundColor: "#f2f2f2"
  },
  badgeText: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    paddingTop: 1
  },
  badgeTextGold: {
    color: "#755700"
  },
  badgeTextGreen: {
    color: employeePalette.green
  },
  badgeTextNeutral: {
    color: employeePalette.muted
  },
  field: {
    gap: 6
  },
  fieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  inputPreview: {
    alignItems: "center",
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16
  },
  inputPreviewLarge: {
    alignItems: "flex-start",
    minHeight: 104,
    paddingVertical: 16
  },
  inputText: {
    color: "#6b7280",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  listRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 88,
    padding: 17
  },
  listIcon: {
    alignItems: "center",
    backgroundColor: "#edf0ee",
    borderRadius: 8,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  listCopy: {
    flex: 1,
    gap: 4
  },
  listTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  listDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  metric: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 16
  },
  metricValue: {
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  metricLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    paddingTop: 4
  },
  pressed: {
    opacity: 0.84
  }
});
