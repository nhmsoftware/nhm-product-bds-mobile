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
import { apiList, apiText, avatarInitial, isApiObject } from "./utils/apiNormalizers";
import type { ApiObject } from "./utils/apiNormalizers";
import { employeeAvatarMaxBytes, employeeDocumentMaxBytes, employeeDocumentMimeType, employeeDocumentMimeTypes } from "./utils/constants";
import { profileValue } from "./utils/formatters";
import { backWithProfileSource } from "./utils/navigation";
import { emptyPersonalProfileForm, formatPersonalDateDisplay, formatPersonalDateValue, parsePersonalDate, personalAttachments, personalCalendarCells, personalFormFromProfile, saveEmployeeDocumentToDevice } from "./utils/sharedHelpers";
import { AvatarEditPencilIcon } from "./utils/sharedHelpers";
import type { PersonalProfileForm } from "./utils/sharedHelpers";
export function PersonalInfoScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const handleBack = () => backWithProfileSource(params.from);
  const { refreshMe, session } = useAuth();
  const { data: profileData, failed, loading } = useEmployeeApiData(() => employeeApi.employeeProfile(), []);
  const [form, setForm] = useState<PersonalProfileForm>(emptyPersonalProfileForm);
  const [attachments, setAttachments] = useState<ApiObject[]>([]);
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("Bằng cấp");
  const [docTypeDropdownOpen, setDocTypeDropdownOpen] = useState(false);
  const user = session?.user;
  const fullName = form.name || user?.fullName || "Nhân viên";
  const jobTitle = (form.employee_title || user?.jobPosition || "Chưa có chức danh").toUpperCase();
  const avatarUri = mediaUrl(form.avatar || user?.avatar);
  const personalInitial = avatarInitial(fullName);

  useEffect(() => {
    if (!isApiObject(profileData)) return;

    setForm(personalFormFromProfile(profileData, user));
    setAttachments(personalAttachments(profileData));
  }, [profileData, user]);

  function updateForm(key: keyof PersonalProfileForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError("Vui lòng cấp quyền truy cập thư viện ảnh để cập nhật ảnh đại diện.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > employeeAvatarMaxBytes) {
      notifyError("Dung lượng ảnh đại diện không được vượt quá 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", {
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
      uri: asset.uri
    } as unknown as Blob);

    setUploadingAvatar(true);
    try {
      const response = await employeeApi.uploadEmployeeAvatar(formData);
      const data = isApiObject(response.data) ? response.data : {};
      const nextAvatar = apiText(data.avatar, "");

      if (nextAvatar) {
        setForm((current) => ({ ...current, avatar: nextAvatar }));
      }

      await refreshMe();
      notifySuccess({ message: response.message || "Cập nhật ảnh đại diện thành công." });
    } catch (error) {
      notifyError(error, "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const response = await employeeApi.updateEmployeeProfile({
        address: form.address,
        avatar: form.avatar || null,
        bank_account_name: form.bank_account_name || null,
        bank_account_number: form.bank_account_number || null,
        bank_name: form.bank_name || null,
        cccd: form.cccd || null,
        dob: form.dob || null,
        education: form.education || null,
        email: form.email,
        employee_title: form.employee_title || null,
        experience: form.experience || null,
        major: form.major || null,
        name: form.name,
        phone: form.phone
      });
      const updatedProfile = isApiObject(response.data) ? response.data : null;

      if (updatedProfile) {
        setForm(personalFormFromProfile(updatedProfile, user));
        setAttachments(personalAttachments(updatedProfile));
      }

      notifySuccess({ message: response.message || "Cập nhật hồ sơ thành công." });
    } catch (error) {
      notifyError(error, "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(type: string) {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: employeeDocumentMimeTypes
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > employeeDocumentMaxBytes) {
      notifyError("Dung lượng tài liệu không được vượt quá 10MB.");
      return;
    }

    const fileName = asset.name || `employee-document-${Date.now()}`;
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", {
      name: fileName,
      type: employeeDocumentMimeType(fileName, asset.mimeType),
      uri: asset.uri
    } as unknown as Blob);

    setUploading(true);
    try {
      const response = await employeeApi.uploadEmployeeDocument(formData);
      const data = isApiObject(response.data) ? response.data : {};
      setAttachments(apiList(data.list));
      notifySuccess({ message: response.message || "Tải tài liệu thành công." });
    } catch (error) {
      notifyError(error, "Không thể tải tài liệu.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.personalSafe}>
      <View style={styles.personalHeader}>
        <Pressable accessibilityRole="button" onPress={handleBack} style={styles.personalHeaderButton}>
          <Ionicons name="arrow-back" size={22} color="#191c1d" />
        </Pressable>
        <Text style={styles.personalHeaderTitle}>Thông tin cá nhân</Text>
        <EmployeeNotificationButton returnTo="/employee/personal-info" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.personalScroll} style={styles.personalRoot}>
        <View style={styles.personalIdentity}>
          <Pressable
            accessibilityRole="button"
            disabled={uploadingAvatar}
            onPress={uploadAvatar}
            style={({ pressed }) => [styles.personalAvatarWrap, pressed && styles.pressed]}
          >
            <View style={styles.personalAvatarFrame}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.personalAvatarImage} />
              ) : (
                <View style={styles.personalAvatarFallback}>
                  <Text style={styles.personalAvatarInitial}>{personalInitial}</Text>
                </View>
              )}
            </View>
            <View style={styles.personalEditAvatar}>
              {uploadingAvatar ? <Ionicons name="hourglass-outline" size={11} color="#ffffff" /> : <AvatarEditPencilIcon />}
            </View>
          </Pressable>
          <Text style={styles.personalName}>{fullName}</Text>
          <Text style={styles.personalRole}>{jobTitle}</Text>
          <View style={styles.personalAwardPill}>
            <Text style={styles.personalAwardText}>{jobTitle || "NHÂN VIÊN"}</Text>
          </View>
        </View>

        <View style={[styles.personalSectionGrid, { zIndex: docTypeDropdownOpen ? 10 : 1 }]}>
          {loading ? <Text style={styles.personalStatusText}>Đang tải hồ sơ nhân viên...</Text> : null}
          {failed ? <Text style={styles.personalStatusText}>Không thể tải hồ sơ, vui lòng thử lại sau.</Text> : null}
          <PersonalSection title="Thông tin cá nhân" icon="id-card-outline">
            <PersonalField
              keyboardType="number-pad"
              label="SỐ CCCD"
              maxLength={20}
              value={form.cccd}
              onChangeText={(value) => updateForm("cccd", value.replace(/\D/g, "").slice(0, 20))}
            />
            <PersonalField label="HỌ VÀ TÊN" value={form.name} onChangeText={(value) => updateForm("name", value)} />
            <PersonalDateField label="NGÀY SINH" value={form.dob} onPress={() => setDobPickerVisible(true)} />
            <PersonalField label="ĐỊA CHỈ THƯỜNG TRÚ" value={form.address} multiline onChangeText={(value) => updateForm("address", value)} />
            <PersonalField label="SỐ ĐIỆN THOẠI" value={form.phone} keyboardType="phone-pad" onChangeText={(value) => updateForm("phone", value)} />
            <PersonalField label="EMAIL CÔNG VIỆC" value={form.email} keyboardType="email-address" onChangeText={(value) => updateForm("email", value)} />
          </PersonalSection>

          <PersonalSection title="Thông tin Ngân hàng" icon="business-outline">
            <PersonalField label="CHỦ TÀI KHOẢN" value={form.bank_account_name} onChangeText={(value) => updateForm("bank_account_name", value.toUpperCase())} />
            <PersonalField label="SỐ TÀI KHOẢN" value={form.bank_account_number} keyboardType="number-pad" onChangeText={(value) => updateForm("bank_account_number", value)} />
            <PersonalField label="NGÂN HÀNG" value={form.bank_name} onChangeText={(value) => updateForm("bank_name", value)} />
          </PersonalSection>

          <PersonalSection title="Trình độ & Kinh nghiệm" icon="school-outline">
            <PersonalEducationExperience form={form} />
          </PersonalSection>

          <PersonalSection title="Tài liệu đính kèm" icon="folder-open-outline">
            <View style={{ marginBottom: 16, zIndex: 999, position: "relative" }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDocTypeDropdownOpen(!docTypeDropdownOpen)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#ffffff",
                  borderColor: "rgba(227, 190, 184, 0.6)",
                  borderWidth: 1,
                  borderRadius: 12,
                  height: 52,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontFamily: appFonts.regular, fontSize: 16, color: "#191c1d" }}>
                  {selectedDocType}
                </Text>
                <Ionicons
                  name={docTypeDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#5b403c"
                />
              </Pressable>

              {docTypeDropdownOpen && (
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "rgba(227, 190, 184, 0.6)",
                    borderWidth: 1,
                    borderRadius: 12,
                    marginTop: 4,
                    overflow: "hidden",
                    position: "absolute",
                    top: 54,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {['Bằng cấp', 'Chứng chỉ', 'CCCD/CMND', 'Hợp đồng lao động', 'Tài liệu khác'].map((type) => {
                    const isSelected = selectedDocType === type;
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedDocType(type);
                          setDocTypeDropdownOpen(false);
                        }}
                        style={({ pressed }) => [
                          {
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            backgroundColor: isSelected ? "#fdf2f0" : pressed ? "#fcf7f6" : "#ffffff",
                            borderBottomWidth: 1,
                            borderBottomColor: "#fdf2f0",
                          }
                        ]}
                      >
                        <Text
                          style={{
                            fontFamily: isSelected ? appFonts.bold : appFonts.regular,
                            fontSize: 15,
                            color: isSelected ? "#950100" : "#191c1d",
                          }}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {attachments.filter(item => apiText(item.type, "").trim() === selectedDocType).length > 0 ? (
              attachments
                .filter(item => apiText(item.type, "").trim() === selectedDocType)
                .map((item, index) => {
                  const docName = apiText(item.name, "Tài liệu nhân sự");
                  return (
                    <PersonalDocument
                      key={`${apiText(item.name ?? item.url, "document")}-${index}`}
                      title={docName}
                      icon="document-text-outline"
                      url={apiText(item.url ?? item.file_url ?? item.fileUrl ?? item.path ?? item.uri, "")}
                    />
                  );
                })
            ) : (
              <Text style={styles.personalStatusText}>Chưa có tài liệu đính kèm thuộc loại này.</Text>
            )}
            
            <Pressable
              accessibilityRole="button"
              onPress={() => uploadDocument(selectedDocType)}
              disabled={uploading}
              style={({ pressed }) => [styles.personalUploadButton, pressed && styles.pressed]}
            >
              <Ionicons name="share-outline" size={16} color="#5b403c" />
              <Text style={styles.personalUploadText}>{uploading ? "Đang tải lên..." : "Tải lên tài liệu mới"}</Text>
            </Pressable>
          </PersonalSection>
        </View>

        <View style={[styles.personalSaveWrap, { zIndex: docTypeDropdownOpen ? 1 : 2 }]}>
          <Pressable accessibilityRole="button" onPress={saveProfile} disabled={saving} style={({ pressed }) => [styles.personalSaveButton, pressed && styles.pressed]}>
            <Ionicons name="save-outline" size={18} color="#ffffff" />
            <Text style={styles.personalSaveText}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <PersonalDatePickerModal
        value={form.dob}
        visible={dobPickerVisible}
        onClose={() => setDobPickerVisible(false)}
        onSelect={(value) => {
          updateForm("dob", value);
          setDobPickerVisible(false);
        }}
      />

    </SafeAreaView>
  );
}

function PersonalSection({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.personalSection}>
      <View style={styles.personalSectionHeader}>
        <Ionicons name={icon} size={20} color="#6a0100" />
        <Text style={styles.personalSectionTitle}>{title}</Text>
      </View>
      <View style={styles.personalSectionBody}>{children}</View>
    </View>
  );
}

function PersonalField({
  editable = true,
  keyboardType,
  label,
  maxLength,
  multiline,
  onChangeText,
  placeholder,
  value
}: {
  editable?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  label: string;
  maxLength?: number;
  multiline?: boolean;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.personalField}>
      <Text style={styles.personalFieldLabel}>{label}</Text>
      <View style={styles.personalInputBox}>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder || "Chưa cập nhật"}
          placeholderTextColor="#8f706b"
          style={[styles.personalInputText, multiline && styles.personalTextArea, !editable && styles.personalInputDisabled]}
          value={value}
        />
      </View>
    </View>
  );
}

function PersonalDateField({
  label,
  onPress,
  value
}: {
  label: string;
  onPress: () => void;
  value: string;
}) {
  const displayValue = formatPersonalDateDisplay(value);

  return (
    <View style={styles.personalField}>
      <Text style={styles.personalFieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.personalInputBox, styles.personalDateInputBox, pressed && styles.pressed]}
      >
        <View>
          <Text style={[styles.personalDateText, !displayValue && styles.personalDatePlaceholder]}>
            {displayValue || "Chọn ngày sinh"}
          </Text>
          <Text style={styles.personalDateHint}>Định dạng lưu: YYYY-MM-DD</Text>
        </View>
        <View style={styles.personalDateIconButton}>
          <Ionicons name="calendar-outline" size={20} color="#950100" />
        </View>
      </Pressable>
    </View>
  );
}

function PersonalDatePickerModal({
  onClose,
  onSelect,
  title = "Chọn ngày sinh",
  value,
  visible
}: {
  onClose: () => void;
  onSelect: (value: string) => void;
  title?: string;
  value: string;
  visible: boolean;
}) {
  const initialDate = parsePersonalDate(value) ?? new Date(2000, 0, 1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [displayMonth, setDisplayMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const cells = personalCalendarCells(displayMonth);
  const todayValue = formatPersonalDateValue(new Date());
  const selectedValue = formatPersonalDateValue(selectedDate);

  useEffect(() => {
    if (!visible) return;

    const nextDate = parsePersonalDate(value) ?? new Date(2000, 0, 1);
    setSelectedDate(nextDate);
    setDisplayMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value, visible]);

  function shiftMonth(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function shiftYear(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear() + offset, current.getMonth(), 1));
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.personalDateOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.personalDateModal}>
          <View style={styles.personalDateModalHeader}>
            <View>
              <Text style={styles.personalDateModalTitle}>{title}</Text>
              <Text style={styles.personalDateModalSubtitle}>{formatPersonalDateDisplay(selectedValue)}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCloseButton}>
              <Ionicons name="close" size={20} color="#5b403c" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarYearRow}>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(-1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="play-back" size={16} color="#950100" />
            </Pressable>
            <Text style={styles.personalCalendarYearText}>Năm {displayMonth.getFullYear()}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="play-forward" size={16} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarHeader}>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(-1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="chevron-back" size={20} color="#950100" />
            </Pressable>
            <Text style={styles.personalCalendarTitle}>Tháng {displayMonth.getMonth() + 1}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(1)} style={styles.personalCalendarNavButton}>
              <Ionicons name="chevron-forward" size={20} color="#950100" />
            </Pressable>
          </View>

          <View style={styles.personalCalendarWeekdays}>
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <Text key={day} style={styles.personalCalendarWeekday}>{day}</Text>
            ))}
          </View>

          <View style={styles.personalCalendarGrid}>
            {cells.map((day, index) => {
              const date = day ? new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day) : null;
              const dateValue = date ? formatPersonalDateValue(date) : "";
              const selected = dateValue === selectedValue;
              const today = dateValue === todayValue;

              return (
                <View key={`${dateValue || "empty"}-${index}`} style={styles.personalCalendarDayCell}>
                  {day ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelectedDate(date as Date)}
                      style={[
                        styles.personalCalendarDay,
                        today && styles.personalCalendarDayToday,
                        selected && styles.personalCalendarDaySelected
                      ]}
                    >
                      <Text style={[styles.personalCalendarDayText, selected && styles.personalCalendarDayTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.personalDateActions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.personalDateCancelButton}>
              <Text style={styles.personalDateCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(formatPersonalDateValue(selectedDate))}
              style={styles.personalDateConfirmButton}
            >
              <Text style={styles.personalDateConfirmText}>Chọn ngày</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
function personalExperienceRows(value: string) {
  const text = profileValue(value);
  const lines = text
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [
      {
        color: "#eec05b",
        company: "Luxury Real Estate Ltd.",
        meta: "2020 - Hiện tại | Senior Sales Manager"
      },
      {
        color: "#c8c6c5",
        company: "Savills Vietnam",
        meta: "2017 - 2020 | Property Consultant"
      }
    ];
  }

  return lines.map((line, index) => {
    const [company, meta] = line.split(/\s+\|\s+/, 2);
    return {
      color: index === 0 ? "#eec05b" : "#c8c6c5",
      company: meta ? company : index === 0 ? "Kinh nghiệm hiện tại" : "Kinh nghiệm trước đây",
      meta: meta || line
    };
  });
}

function PersonalEducationExperience({ form }: { form: PersonalProfileForm }) {
  const education = profileValue(form.education, "Đại học Kinh tế TP.HCM");
  const major = profileValue(form.major, "Quản trị Kinh doanh Bất động sản");
  const rows = personalExperienceRows(form.experience);

  return (
    <View style={styles.personalEducationBlock}>
      <View style={styles.personalEducation}>
        <Text style={styles.personalMiniLabel}>HỌC VẤN</Text>
        <Text style={styles.personalEducationTitle}>{education}</Text>
        <Text style={styles.personalEducationText}>Chuyên ngành: {major}</Text>
      </View>
      <View style={styles.personalExperience}>
        <Text style={styles.personalMiniLabel}>KINH NGHIỆM LÀM VIỆC</Text>
        <View style={styles.personalExperienceList}>
          {rows.map((row) => (
            <PersonalExperienceRow
              key={`${row.company}-${row.meta}`}
              color={row.color}
              company={row.company}
              meta={row.meta}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function PersonalExperienceRow({
  color,
  company,
  meta
}: {
  color: string;
  company: string;
  meta: string;
}) {
  return (
    <View style={styles.personalExperienceItem}>
      <View style={[styles.personalExperienceDot, { backgroundColor: color }]} />
      <View style={styles.personalExperienceCopy}>
        <Text style={styles.personalExperienceCompany}>{company}</Text>
        <Text style={styles.personalExperienceMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function PersonalDocument({
  icon,
  title,
  url
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  url?: string;
}) {
  const documentUrl = mediaUrl(url);
  const [downloading, setDownloading] = useState(false);

  function viewDocument() {
    if (!documentUrl) {
      notifyError("Tài liệu này chưa có đường dẫn để mở.");
      return;
    }

    router.push({
      pathname: "/employee/document-viewer",
      params: { title, url: documentUrl }
    });
  }

  async function downloadDocument() {
    if (!documentUrl) {
      notifyError("Tài liệu này chưa có đường dẫn để tải về.");
      return;
    }

    setDownloading(true);
    try {
      const fileName = await saveEmployeeDocumentToDevice(documentUrl, title);
      notifySuccess({ message: `Đã chuẩn bị tài liệu: ${fileName}. Chọn "Lưu vào Tệp" để lưu về máy.` });
    } catch (error) {
      appLogger.warn("employee.profile.document.download", "Không thể tải tài liệu nhân sự.", { title, url: documentUrl, error });
      notifyError(error, "Không thể tải tài liệu này.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={styles.personalDocRow}>
      <View style={styles.personalDocTitleRow}>
        <Ionicons name={icon} size={21} color="#950100" />
        <Text numberOfLines={2} style={styles.personalDocTitle}>{title}</Text>
      </View>
      <View style={styles.personalDocActions}>
        <Pressable
          accessibilityLabel={`Xem tài liệu ${title}`}
          accessibilityRole="button"
          disabled={!documentUrl}
          onPress={viewDocument}
          style={({ pressed }) => [styles.personalDocActionButton, pressed && styles.pressed]}
        >
          <Ionicons name="eye-outline" size={18} color={documentUrl ? "#5b403c" : "#b8aaa8"} />
        </Pressable>
        <Pressable
          accessibilityLabel={`Tải tài liệu ${title}`}
          accessibilityRole="button"
          disabled={!documentUrl || downloading}
          onPress={downloadDocument}
          style={({ pressed }) => [styles.personalDocActionButton, pressed && styles.pressed]}
        >
          <Ionicons name={downloading ? "hourglass-outline" : "download-outline"} size={17} color={documentUrl ? "#5b403c" : "#b8aaa8"} />
        </Pressable>
      </View>
    </View>
  );
}

