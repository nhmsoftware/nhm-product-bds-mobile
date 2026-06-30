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
export function MandatoryCourseGate({ children, returnTo }: { children: ReactNode; returnTo: string }) {
  const { loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    let active = true;
    setChecking(true);

    employeeApi
      .learningAccess()
      .then((result) => {
        if (!active) return;
        const completed = Boolean(result.mandatoryLearningCompleted);
        setAllowed(completed);
        if (!completed && !redirected.current) {
          redirected.current = true;
          router.replace({
            pathname: "/employee/mandatory-courses",
            params: { returnTo }
          });
        }
      })
      .catch(() => {
        if (active) setAllowed(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => { active = false; };
  }, [authLoading, returnTo]);

  if (authLoading || checking) {
    return (
      <EmployeePage headerTitle="" back={() => router.back()} backType="previous">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <ActivityIndicator color={employeePalette.goldDark} />
        </View>
      </EmployeePage>
    );
  }

  if (!allowed) {
    return (
      <EmployeePage headerTitle="" back={() => router.back()} backType="previous">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
          <ActivityIndicator color={employeePalette.goldDark} />
        </View>
      </EmployeePage>
    );
  }

  return <>{children}</>;
}

