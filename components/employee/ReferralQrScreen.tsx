import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { VideoView, useVideoPlayer } from "expo-video";
import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator, AppState, Alert, BackHandler, Clipboard, Image, Linking, Modal,
  KeyboardAvoidingView, Platform, Pressable as RNPressable, RefreshControl, ScrollView, Share,
  StyleSheet, Text, TextInput, useWindowDimensions,
  type GestureResponderEvent, type ImageSourcePropType, type LayoutChangeEvent,
  type NativeScrollEvent, type NativeSyntheticEvent, type TextLayoutEventData, View
} from "react-native";
import { Pressable } from "@/components/SafePressable";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { Path, Svg, SvgUri } from "react-native-svg";
import {
  EMPLOYEE_HEADER_HEIGHT, EmployeeAvatarButton, EmployeeBadge, EmployeeButton, EmployeeCard,
  EmployeeInputPreview, EmployeeListRow, EmployeeMetric, EmployeeNotificationButton,
  EmployeePage, EmployeeSectionTitle
} from "@/components/EmployeeUI";
import { employeePalette } from "@/libs/employee-theme";
import { API_URL, STORAGE_KEYS } from "@/libs/env";
import { useI18n } from "@/libs/i18n";
import { appLogger } from "@/libs/logger";
import { mediaSource, mediaUrl } from "@/libs/media";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { ApiRequestError } from "@/libs/api";
import { isBaseEmployeeRole, isDepartmentTransferApproverRole, isExecutiveAdminRole, isManagerAccessRole, isRecruitmentApproverRole } from "@/services/auth/roles";
import { useAuth } from "@/services/auth/store";
import type { AuthSession, AuthUser } from "@/services/auth/types";
import { employeeApi } from "@/services/employee/api";
import { useNotificationState, useRealtimeEvent, useRealtimeRoom } from "@/services/notifications/provider";
import type { LearningLessonAttachment, LearningLessonDetail, LearningLessonProgressUpdate, MandatoryLearningCourse, MandatoryLearningLesson, MandatoryLearningQuiz } from "@/services/employee/types";
import WebView from "react-native-webview";
import { RichText, Toolbar, DEFAULT_TOOLBAR_ITEMS, useEditorBridge, useBridgeState, ImageBridge, TenTapStartKit } from "@10play/tentap-editor";
import RenderHtml from "react-native-render-html";
import { styles } from "@/components/employee/utils/styles";
import { useEmployeeApiData } from "./hooks/useEmployeeApiData";
import { apiText, isApiObject } from "./utils/apiNormalizers";
import { useCopy, vi } from "./utils/i18n";
import { backWithProfileSource } from "./utils/navigation";
export function ReferralQrScreen() {
  const c = useCopy().qr;
  const { session } = useAuth();
  const userPhone = session?.user?.phone || "";
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  
  const { data: customerQrData } = useEmployeeApiData(() => employeeApi.customerReferralQr(), []);
  const customerQr = referralQrValue(customerQrData);
  const activeQrValue = customerQr;
  const activeReferralCode = isApiObject(customerQrData)
    ? apiText(customerQrData.referral_code ?? customerQrData.referralCode ?? customerQrData.code, "")
    : "";

  async function shareQr() {
    try {
      await Share.share({
        message: referralQrShareText(
          customerQrData,
          activeQrValue || c.customerSubtitle
        )
      });
    } catch (error) {
      appLogger.warn("employee.referral_qr.share", "Không thể chia sẻ mã giới thiệu.", { error });
      notifyError("Không thể chia sẻ mã lúc này.");
    }
  }

  return (
    <EmployeePage back={handleBack} contentStyle={styles.referralQrContent}>
      <Text style={styles.referralQrTitle}>{c.title}</Text>
      
      <ReferralQrPanel 
        copy={c} 
        mode="customer" 
        qrValue={activeQrValue} 
        referralCode={activeReferralCode} 
        onShare={shareQr} 
      />
    </EmployeePage>
  );
}

function ReferralQrSegmentButton({
  active,
  label,
  onPress,
  size
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  size: "narrow" | "wide";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.referralQrSegmentButton,
        size === "wide" ? styles.referralQrSegmentButtonWide : styles.referralQrSegmentButtonNarrow,
        active ? styles.referralQrSegmentButtonGreen : styles.referralQrSegmentButtonMuted,
        pressed && styles.pressed
      ]}
    >
      <Text style={styles.referralQrSegmentText}>{label}</Text>
    </Pressable>
  );
}

function referralQrValue(data: unknown) {
  if (!isApiObject(data)) {
    return "";
  }

  const value = apiText(
    data.qr_url ??
      data.qrUrl ??
      data.qr_image ??
      data.qrImage ??
      data.image_url ??
      data.imageUrl ??
      data.qr_value ??
      data.qrValue ??
      data.qr_data ??
      data.qrData ??
      data.share_url ??
      data.shareUrl ??
      data.url ??
      data.referral_code ??
      data.referralCode ??
      data.code,
    ""
  );

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return value;
}

function referralQrShareText(data: unknown, fallback: string) {
  if (!isApiObject(data)) {
    return fallback;
  }

  return apiText(
    data.share_text ??
      data.shareText ??
      data.description ??
      data.referral_code ??
      data.referralCode,
    fallback
  );
}

function isRemoteImage(value: string) {
  return /^(data:image\/|https?:\/\/.*\.(?:png|jpe?g|webp|gif|svg)(?:$|[?#]))/i.test(value);
}

function isRemoteSvg(value: string) {
  return /\.svg($|\?)/i.test(value);
}

function ReferralQrPanel({
  copy,
  mode = "customer",
  onShare,
  qrValue = "",
  referralCode = ""
}: {
  copy: typeof vi.qr;
  mode?: "recruitment" | "customer";
  onShare?: () => void;
  qrValue?: string;
  referralCode?: string;
}) {
  const helper = mode === "customer" ? copy.customerSubtitle : copy.recruitmentSubtitle;
  const remoteImage = isRemoteImage(qrValue);
  const remoteSvg = remoteImage && isRemoteSvg(qrValue);

  const copyToClipboard = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
      notifySuccess({ message: "Đã sao chép mã giới thiệu vào bộ nhớ tạm." });
    }
  };

  return (
    <View style={styles.qrCard}>
      <Text style={styles.referralQrHelper}>{helper}</Text>
      <View style={styles.qrImageFrame}>
        {remoteSvg ? (
          <SvgUri height={160} uri={qrValue} width={160} />
        ) : remoteImage ? (
          <Image source={{ uri: qrValue }} style={styles.qrImage} />
        ) : qrValue ? (
          <QRCode backgroundColor="#ffffff" color="#191C1D" size={160} value={qrValue} />
        ) : (
          <ReferralQrCode />
        )}
      </View>

      {referralCode ? (
        <Pressable 
          accessibilityRole="button"
          onPress={copyToClipboard}
          style={({ pressed }) => [styles.referralCodeContainer, pressed && styles.pressed]}
        >
          <Text style={styles.referralCodeLabel}>MÃ GIỚI THIỆU CỦA BẠN</Text>
          <View style={styles.referralCodeRow}>
            <Text style={styles.referralCodeText}>{referralCode}</Text>
            <Ionicons name="copy-outline" size={16} color={employeePalette.red} />
          </View>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onShare}
        style={({ pressed }) => [styles.qrShareButton, pressed && styles.pressed]}
      >
        <Ionicons name="share-social-outline" size={17} color="#ffffff" />
        <Text style={styles.qrShareText}>{copy.share}</Text>
      </Pressable>
    </View>
  );
}

function ReferralQrCode() {
  return (
    <Svg height="100%" viewBox="0 0 160 160" width="100%">
      <Path d="M0 0H70V70H0V0V0M10 10V60H60V10H10V10" fill="#191C1D" />
      <Path d="M20 20H50V50H20V20V20" fill="#191C1D" />
      <Path d="M90 0H160V70H90V0V0M100 10V60H150V10H100V10" fill="#191C1D" />
      <Path d="M110 20H140V50H110V20V20" fill="#191C1D" />
      <Path d="M0 90H70V160H0V90V90M10 100V150H60V100H10V100" fill="#191C1D" />
      <Path d="M20 110H50V140H20V110V110" fill="#191C1D" />
      <Path d="M90 90H110V110H90V90V90" fill="#191C1D" />
      <Path d="M120 90H140V110H120V90V90" fill="#191C1D" />
      <Path d="M140 110H160V130H140V110V110" fill="#191C1D" />
      <Path d="M110 120H130V140H110V120V120" fill="#191C1D" />
      <Path d="M90 140H110V160H90V140V140" fill="#191C1D" />
      <Path d="M130 140H160V160H130V140V140" fill="#191C1D" />
    </Svg>
  );
}

