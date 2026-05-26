import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { employeePalette } from "@/libs/employee-theme";
import { useI18n } from "@/libs/i18n";
import { appFonts } from "@/libs/typography";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type AuthContactMethod = "email" | "phone";

type AuthScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  footerMode?: "inline" | "bar";
  variant?: "default" | "register";
  brandGap?: number;
  headerTitle?: string;
  scrollTopPadding?: number;
  onBackPress?: () => void;
}>;

type AuthFieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  icon?: IconName;
  error?: string;
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  frameStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

type AuthButtonProps = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  rightIcon?: IconName;
  style?: StyleProp<ViewStyle>;
};

type AuthCheckboxProps = PropsWithChildren<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
}>;

type AuthFooterCtaProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

const contactMethods: { value: AuthContactMethod; label: string }[] = [
  { value: "email", label: "auth.method.email" },
  { value: "phone", label: "auth.method.phone" }
];

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  footerMode = "inline",
  variant = "default",
  brandGap,
  headerTitle,
  scrollTopPadding,
  onBackPress
}: AuthScreenProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const showHeading = Boolean(title || subtitle);
  const showHeader = Boolean(headerTitle || onBackPress);
  const computedBrandGap =
    brandGap ?? (variant === "register" ? 59 : showHeading ? 20 : 20);
  const footerBottomPadding =
    Platform.OS === "android" ? Math.max(insets.bottom, 22) : Math.max(insets.bottom, 10);
  const footerTopPadding = Platform.OS === "android" ? 18 : 14;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.root}>
          {showHeader ? (
            <View style={styles.authHeader}>
              {onBackPress ? (
                <Pressable
                  accessibilityLabel={t("common.back")}
                  accessibilityRole="button"
                  onPress={onBackPress}
                  style={styles.authHeaderBack}
                >
                  <Ionicons name="arrow-back" size={28} color={employeePalette.text} />
                </Pressable>
              ) : (
                <View style={styles.authHeaderBack} />
              )}
              {headerTitle ? <Text style={styles.authHeaderTitle}>{headerTitle}</Text> : null}
            </View>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              variant === "register" ? styles.scrollRegister : styles.scrollDefault,
              scrollTopPadding !== undefined && { paddingTop: scrollTopPadding },
              footerMode === "bar" && styles.scrollWithFooter,
              footerMode !== "bar" && {
                paddingBottom: Platform.OS === "android" ? Math.max(insets.bottom, 56) : 56
              }
            ]}
          >
            <View
              style={[
                styles.container,
                variant === "register" && styles.registerContainer
              ]}
            >
              <AuthLogo style={{ marginBottom: computedBrandGap }} />

              {showHeading ? (
                <View style={styles.heading}>
                  {title ? <Text style={styles.title}>{title}</Text> : null}
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
              ) : null}

              <View
                style={[
                  styles.form,
                  variant === "register" ? styles.formRegister : styles.formDefault
                ]}
              >
                {children}
              </View>
              {footer && footerMode === "inline" ? (
                <View style={styles.inlineFooter}>{footer}</View>
              ) : null}
            </View>
          </ScrollView>

          {footer && footerMode === "bar" ? (
            <View
              style={[
                styles.footerBar,
                {
                  minHeight: 44 + footerTopPadding + footerBottomPadding,
                  paddingBottom: footerBottomPadding,
                  paddingTop: footerTopPadding
                }
              ]}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthLogo({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.brandBlock, style]}>
      <Image
        source={require("@/assets/images/logo/header.png")}
        resizeMode="contain"
        style={styles.logoImage}
      />
    </View>
  );
}

export function AuthMethodTabs({
  value,
  onChange
}: {
  value: AuthContactMethod;
  onChange: (value: AuthContactMethod) => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.tabs}>
      {contactMethods.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={styles.tabButton}
          >
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {t(item.label as "auth.method.email" | "auth.method.phone")}
            </Text>
            <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function AuthField({
  label,
  icon,
  error,
  right,
  containerStyle,
  frameStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputFrame,
          focused && styles.inputFocused,
          error && styles.inputError,
          frameStyle
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? employeePalette.red : stylesConfig.icon}
            style={styles.inputIcon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={stylesConfig.placeholder}
          style={[styles.input, inputStyle]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {right}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function AuthPasswordField(props: Omit<AuthFieldProps, "right">) {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  return (
    <AuthField
      {...props}
      secureTextEntry={!visible}
      right={
        <Pressable
          accessibilityLabel={
            visible
              ? t("auth.accessibility.hidePassword")
              : t("auth.accessibility.showPassword")
          }
          onPress={() => setVisible((value) => !value)}
          style={styles.passwordToggle}
        >
          <Ionicons
            name={visible ? "eye-outline" : "eye-off-outline"}
            size={22}
            color={employeePalette.muted}
          />
        </Pressable>
      }
      inputStyle={[styles.passwordInput, props.inputStyle]}
    />
  );
}

export function AuthCheckbox({
  checked,
  onChange,
  label,
  children,
  style
}: AuthCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={[styles.checkboxRow, style]}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color="#ffffff" /> : null}
      </View>
      {children ?? <Text style={styles.checkboxText}>{label}</Text>}
    </Pressable>
  );
}

export function AuthButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  rightIcon,
  style
}: AuthButtonProps) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.authButton,
        isPrimary && styles.authButtonPrimary,
        isSecondary && styles.authButtonSecondary,
        variant === "ghost" && styles.authButtonGhost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#ffffff" : employeePalette.red} />
      ) : (
        <View style={styles.buttonContent}>
          <Text
            style={[
              styles.authButtonText,
              isPrimary && styles.authButtonPrimaryText,
              !isPrimary && styles.authButtonSecondaryText
            ]}
          >
            {title}
          </Text>
          {rightIcon ? (
            <Ionicons
              name={rightIcon}
              size={18}
              color={isPrimary ? "#ffffff" : employeePalette.red}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export function AuthFooterCta({ prompt, action, onPress }: AuthFooterCtaProps) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>{prompt}</Text>
      <Pressable onPress={onPress}>
        <Text style={styles.footerLink}>{action}</Text>
      </Pressable>
    </View>
  );
}

const stylesConfig = {
  icon: "#98756f",
  placeholder: "#bdbdbd"
};

const styles = StyleSheet.create({
  safe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  flex: {
    flex: 1
  },
  root: {
    flex: 1
  },
  authHeader: {
    alignItems: "center",
    backgroundColor: employeePalette.bg,
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 62,
    paddingHorizontal: 20
  },
  authHeaderBack: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginLeft: -8,
    width: 44
  },
  authHeaderTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20
  },
  scrollDefault: {
    justifyContent: "center",
    paddingBottom: 56,
    paddingTop: 126
  },
  scrollRegister: {
    justifyContent: "flex-start",
    paddingBottom: 44,
    paddingTop: 49
  },
  scrollWithFooter: {
    paddingBottom: 30
  },
  container: {
    alignSelf: "center",
    maxWidth: 430,
    width: "100%"
  },
  registerContainer: {
    maxWidth: 390
  },
  brandBlock: {
    alignItems: "center"
  },
  logoImage: {
    height: 97,
    width: 200
  },
  heading: {
    marginBottom: 48
  },
  title: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 18,
    fontWeight: "400",
    lineHeight: 30.6,
    textAlign: "center"
  },
  subtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
    textAlign: "center"
  },
  form: {
    gap: 24
  },
  formDefault: {
    gap: 24
  },
  formRegister: {
    gap: 16
  },
  tabs: {
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 24,
    minHeight: 36.6
  },
  tabButton: {
    gap: 5,
    paddingBottom: 0
  },
  tabLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  tabLabelActive: {
    color: employeePalette.red
  },
  tabIndicator: {
    backgroundColor: "transparent",
    height: 3,
    width: "100%"
  },
  tabIndicatorActive: {
    backgroundColor: employeePalette.red
  },
  fieldWrap: {
    gap: 4
  },
  fieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  inputFrame: {
    alignItems: "center",
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 16
  },
  inputFocused: {
    borderColor: employeePalette.red
  },
  inputError: {
    borderColor: "#d14343"
  },
  inputIcon: {
    marginRight: 13
  },
  input: {
    color: "#6b7280",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    minHeight: 46,
    padding: 0
  },
  passwordInput: {
    paddingRight: 8
  },
  passwordToggle: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    marginRight: -7,
    width: 48
  },
  errorText: {
    color: "#d14343",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18
  },
  checkboxRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12
  },
  checkboxBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#efc6bf",
    borderRadius: 3,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    marginTop: 3,
    width: 20
  },
  checkboxBoxChecked: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red
  },
  checkboxText: {
    color: employeePalette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  authButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18
  },
  authButtonPrimary: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.09,
    shadowRadius: 25,
    elevation: 5
  },
  authButtonSecondary: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border
  },
  authButtonGhost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    minHeight: 40
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center"
  },
  authButtonText: {
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1,
    textAlignVertical: "center"
  },
  authButtonPrimaryText: {
    color: "#ffffff"
  },
  authButtonSecondaryText: {
    color: employeePalette.red
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.84
  },
  inlineFooter: {
    alignItems: "center",
    marginTop: 24
  },
  footerBar: {
    alignItems: "center",
    backgroundColor: employeePalette.subtle,
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    minHeight: 76,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center"
  },
  footerText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  footerLink: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.32,
    lineHeight: 24
  }
});
