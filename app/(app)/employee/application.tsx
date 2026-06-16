import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { type ReactNode, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Path, Svg } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "@/components/SafePressable";
import { notifyError, notifySuccess } from "@/libs/notify";
import { appFonts } from "@/libs/typography";
import { useAuth } from "@/services/auth/store";

const palette = {
  background: "#f8f9fa",
  border: "#edc8c2",
  brown: "#5b403c",
  darkRed: "#6a0100",
  gold: "#795900",
  muted: "#6b7280",
  placeholder: "#7b8494",
  text: "#191c1d",
  white: "#ffffff"
};
const applicationPositions = [
  "Cộng tác viên",
  "Chuyên viên Kinh doanh",
  "Trưởng phòng Kinh doanh",
  "Giám đốc Kinh doanh"
];


function formatTwoDigits(value: number) {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
}

function formatBirthDateValue(date: Date) {
  return `${formatTwoDigits(date.getDate())}/${formatTwoDigits(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function parseBirthDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;

  const [dayText, monthText, yearText] = value.split("/");
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date;
}

function applicationCalendarCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isValidBirthDate(value: string) {
  if (!value) return true;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const [dayText, monthText, yearText] = value.split("/");
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const now = new Date();

  if (month < 1 || month > 12 || year < 1900 || year > now.getFullYear()) return false;

  const date = new Date(year, month - 1, day);
  const validParts = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return validParts && date <= now;
}

export default function EmployeeApplicationScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [referralCode, setReferralCode] = useState("");
  const [dob, setDob] = useState("");
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [applicationPosition, setApplicationPosition] = useState("");
  const [positionPickerVisible, setPositionPickerVisible] = useState(false);
  const [education, setEducation] = useState("");
  const [experienceCompany, setExperienceCompany] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [intro, setIntro] = useState("");

  function submit() {
    if (!name.trim()) {
      notifyError("Vui lòng nhập họ và tên.");
      return;
    }
    if (!phone.trim()) {
      notifyError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (dob.trim() && !isValidBirthDate(dob)) {
      notifyError("Ngày sinh không hợp lệ. Vui lòng nhập đúng định dạng dd/mm/yyyy.");
      return;
    }
    if (!applicationPosition.trim()) {
      notifyError("Vui lòng chọn vị trí ứng tuyển.");
      return;
    }

    notifySuccess({ message: "Đã ghi nhận hồ sơ ứng tuyển. Quản trị viên sẽ duyệt trước khi mở mã QR giới thiệu khách hàng." });
    router.back();
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={26} color={palette.darkRed} />
        </Pressable>
        <Text style={styles.headerTitle}>Ứng Tuyển</Text>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{(user?.fullName || "U").trim().charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>CƠ HỘI NGHỀ NGHIỆP</Text>
          <Text style={styles.title}>Gia nhập Khởi Nguyên Land</Text>
          <Text style={styles.description}>
            Gia nhập đội ngũ dẫn đầu trong lĩnh vực quản lý bất động sản cao cấp. Hồ sơ sẽ được admin xét duyệt trước khi mở quyền giới thiệu khách hàng.
          </Text>
        </View>

        <ApplicationSection iconKey="personal" title="Thông tin cá nhân">
          <ApplicationInput label="HỌ VÀ TÊN" value={name} onChangeText={setName} placeholder="Nguyễn Văn A" />
          <ApplicationInput label="SỐ ĐIỆN THOẠI" value={phone} onChangeText={setPhone} placeholder="090 123 4567" keyboardType="phone-pad" />
          <ApplicationDateField label="NGÀY SINH" value={dob} onPress={() => setDobPickerVisible(true)} />
          <ApplicationInput label="MÃ GIỚI THIỆU" value={referralCode} onChangeText={setReferralCode} placeholder="VD: KN-123" />
        </ApplicationSection>

        <ApplicationSection iconKey="professional" title="Hồ sơ chuyên môn">
          <ApplicationSelect
            label="VỊ TRÍ ỨNG TUYỂN"
            onPress={() => setPositionPickerVisible(true)}
            placeholder="Chọn vị trí ứng tuyển"
            value={applicationPosition}
          />
          <ApplicationInput label="TRÌNH ĐỘ HỌC VẤN" value={education} onChangeText={setEducation} placeholder="VD: Đại học" />
          <ApplicationInput
            label="SỐ NĂM KINH NGHIỆM / CÔNG TY"
            value={experienceCompany}
            onChangeText={setExperienceCompany}
            placeholder="VD: 3 năm tại Khởi Nguyên Land"
          />
          <ApplicationInput label="PROFILE (TÙY CHỌN)" value={profileUrl} onChangeText={setProfileUrl} placeholder="VD: linkedin.com/in/" />
        </ApplicationSection>

        <ApplicationSection iconKey="intro" title="Giới thiệu bản thân">
          <TextInput
            multiline
            onChangeText={setIntro}
            placeholder="Chia sẻ thêm về mục tiêu nghề nghiệp hoặc điều đặc biệt khiến bạn phù hợp với Khởi Nguyên Land..."
            placeholderTextColor="#7b8494"
            style={[styles.input, styles.textarea]}
            value={intro}
          />
        </ApplicationSection>

        <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
          <Text style={styles.submitText}>Nộp hồ sơ ngay</Text>
          <Ionicons name="arrow-forward" size={24} color={palette.white} />
        </Pressable>

        <View style={styles.secureRow}>
          <TrustBadgeIcon />
          <Text style={styles.secureText}>ỨNG TUYỂN BẢO MẬT & TIN CẬY</Text>
        </View>
      </ScrollView>
      <ApplicationBirthDateModal
        value={dob}
        visible={dobPickerVisible}
        onClose={() => setDobPickerVisible(false)}
        onSelect={(value) => {
          setDob(value);
          setDobPickerVisible(false);
        }}
      />
      <Modal animationType="fade" onRequestClose={() => setPositionPickerVisible(false)} transparent visible={positionPickerVisible}>
        <Pressable onPress={() => setPositionPickerVisible(false)} style={styles.positionModalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.positionModal}>
            <View style={styles.positionModalHeader}>
              <Text style={styles.positionModalTitle}>Chọn vị trí ứng tuyển</Text>
              <Pressable accessibilityRole="button" onPress={() => setPositionPickerVisible(false)} style={styles.positionModalClose}>
                <Ionicons name="close" size={22} color={palette.darkRed} />
              </Pressable>
            </View>
            <View style={styles.positionModalList}>
              {applicationPositions.map((position) => {
                const active = position === applicationPosition;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={position}
                    onPress={() => {
                      setApplicationPosition(position);
                      setPositionPickerVisible(false);
                    }}
                    style={({ pressed }) => [styles.positionOption, active && styles.positionOptionActive, pressed && styles.pressed]}
                  >
                    <Text style={[styles.positionOptionText, active && styles.positionOptionTextActive]}>{position}</Text>
                    {active ? <Ionicons name="checkmark" size={20} color={palette.darkRed} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

type ApplicationIconKey = "personal" | "professional" | "cv" | "intro";

function ApplicationSection({ children, iconKey, title }: { children: ReactNode; iconKey: ApplicationIconKey; title: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ApplicationIcon name={iconKey} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function ApplicationIcon({ name }: { name: ApplicationIconKey }) {
  if (name === "personal") {
    return (
      <Svg height={30} viewBox="0 0 15 15" width={30}>
        <Path d="M7.49996 6.99993C6.53459 6.99993 5.70992 6.65794 5.02595 5.97398C4.34198 5.29001 4 4.46534 4 3.49996C4 2.53459 4.34198 1.70992 5.02595 1.02595C5.70992 0.341984 6.53459 0 7.49996 0C8.46534 0 9.29001 0.341984 9.97398 1.02595C10.6579 1.70992 10.9999 2.53459 10.9999 3.49996C10.9999 4.46534 10.6579 5.29001 9.97398 5.97398C9.29001 6.65794 8.46534 6.99993 7.49996 6.99993V6.99993M0 14.6153V12.3922C0 11.9025 0.133012 11.449 0.399036 11.0317C0.665059 10.6144 1.02051 10.2936 1.46537 10.0692C2.45383 9.58458 3.45094 9.22112 4.45671 8.97882C5.46247 8.73651 6.47689 8.61536 7.49996 8.61536C8.52303 8.61536 9.53745 8.73651 10.5432 8.97882C11.549 9.22112 12.5461 9.58458 13.5346 10.0692C13.9794 10.2936 14.3349 10.6144 14.6009 11.0317C14.8669 11.449 14.9999 11.9025 14.9999 12.3922V14.6153H0V14.6153M1.49996 13.1153H13.5V12.3922C13.5 12.1897 13.4413 12.0022 13.324 11.8297C13.2067 11.6573 13.0474 11.5166 12.8461 11.4076C11.9846 10.9833 11.1061 10.6618 10.2107 10.4432C9.31524 10.2246 8.41167 10.1153 7.49996 10.1153C6.58826 10.1153 5.68469 10.2246 4.78926 10.4432C3.89384 10.6618 3.01536 10.9833 2.15382 11.4076C1.95253 11.5166 1.79324 11.6573 1.67593 11.8297C1.55862 12.0022 1.49996 12.1897 1.49996 12.3922V13.1153V13.1153M7.49996 5.49996C8.04996 5.49996 8.5208 5.30413 8.91246 4.91246C9.30413 4.5208 9.49996 4.04996 9.49996 3.49996C9.49996 2.94996 9.30413 2.47913 8.91246 2.08746C8.5208 1.6958 8.04996 1.49996 7.49996 1.49996C6.94996 1.49996 6.47913 1.6958 6.08746 2.08746C5.6958 2.47913 5.49996 2.94996 5.49996 3.49996C5.49996 4.04996 5.6958 4.5208 6.08746 4.91246C6.47913 5.30413 6.94996 5.49996 7.49996 5.49996V5.49996M7.49996 3.49996V3.49996V3.49996V3.49996V3.49996V3.49996V3.49996V3.49996V3.49996V3.49996M7.49996 13.1153V13.1153V13.1153V13.1153V13.1153V13.1153V13.1153V13.1153V13.1153V13.1153V13.1153V13.1153V13.1153" fill={palette.darkRed} />
      </Svg>
    );
  }

  if (name === "professional") {
    return (
      <Svg height={30} viewBox="0 0 20 20" width={30}>
        <Path d="M1.49996 15.9999V15.9999C1.49996 15.9999 1.49996 15.9711 1.49996 15.9134C1.49996 15.8557 1.49996 15.782 1.49996 15.6922V5.30764C1.49996 5.21789 1.49996 5.14417 1.49996 5.08647C1.49996 5.02878 1.49996 4.99993 1.49996 4.99993V4.99993C1.49996 4.99993 1.49996 5.02878 1.49996 5.08647C1.49996 5.14417 1.49996 5.21789 1.49996 5.30764V15.6922V15.6922V15.6922V15.6922V15.6922C1.49996 15.5191 1.49996 15.4855 1.49996 15.5913C1.49996 15.697 1.49996 15.8333 1.49996 15.9999V15.9999M1.80768 17.4999C1.30255 17.4999 0.874992 17.3249 0.524995 16.9749C0.174998 16.6249 0 16.1973 0 15.6922V5.30764C0 4.80252 0.174998 4.37496 0.524995 4.02496C0.874992 3.67496 1.30255 3.49996 1.80768 3.49996H6V1.80768C6 1.30255 6.175 0.874992 6.525 0.524995C6.87499 0.174998 7.30255 0 7.80768 0H11.1922C11.6974 0 12.1249 0.174998 12.4749 0.524995C12.8249 0.874992 12.9999 1.30255 12.9999 1.80768V3.49996H17.1922C17.6974 3.49996 18.1249 3.67496 18.4749 4.02496C18.8249 4.37496 18.9999 4.80252 18.9999 5.30764V9.54418C18.7704 9.38521 18.5323 9.24739 18.2855 9.13073C18.0387 9.01406 17.7769 8.91022 17.5 8.8192V5.30764C17.5 5.21789 17.4711 5.14417 17.4134 5.08647C17.3557 5.02878 17.282 4.99993 17.1922 4.99993H1.80768C1.71793 4.99993 1.6442 5.02878 1.58651 5.08647C1.52881 5.14417 1.49996 5.21789 1.49996 5.30764V15.6922C1.49996 15.782 1.52881 15.8557 1.58651 15.9134C1.6442 15.9711 1.71793 15.9999 1.80768 15.9999H9.075C9.11859 16.2666 9.17596 16.5233 9.24711 16.7701C9.31826 17.0169 9.4064 17.2602 9.51153 17.4999H1.80768V17.4999M7.49996 3.49996H11.5V1.80768C11.5 1.71793 11.4711 1.6442 11.4134 1.58651C11.3557 1.52881 11.282 1.49996 11.1922 1.49996H7.80768C7.71793 1.49996 7.6442 1.52881 7.58651 1.58651C7.52881 1.6442 7.49996 1.71793 7.49996 1.80768V3.49996V3.49996M15.5 19.4999C14.2513 19.4999 13.1891 19.0621 12.3135 18.1864C11.4378 17.3108 11 16.2486 11 14.9999C11 13.7512 11.4378 12.689 12.3135 11.8134C13.1891 10.9378 14.2513 10.5 15.5 10.5C16.7487 10.5 17.8108 10.9378 18.6865 11.8134C19.5621 12.689 19.9999 13.7512 19.9999 14.9999C19.9999 16.2486 19.5621 17.3108 18.6865 18.1864C17.8108 19.0621 16.7487 19.4999 15.5 19.4999V19.4999M15.9423 14.8192V12.0576H15.0577V15.1807L17.15 17.273L17.773 16.6499L15.9423 14.8192V14.8192" fill={palette.darkRed} />
      </Svg>
    );
  }

  if (name === "cv") {
    return (
      <Svg height={30} viewBox="0 0 15 19" width={30}>
        <Path d="M6.74998 15.8845H8.24994V11.4499L10.1 13.2999L11.1538 12.2307L7.49996 8.57689L3.84614 12.2307L4.91535 13.2845L6.74998 11.4499V15.8845ZM1.80768 18.9999C1.30255 18.9999 0.874992 18.8249 0.524995 18.4749C0.174998 18.1249 0 17.6974 0 17.1922V1.80768C0 1.30255 0.174998 0.874992 0.524995 0.524995C0.874992 0.174998 1.30255 0 1.80768 0H9.74998L14.9999 5.24995V17.1922C14.9999 17.6974 14.8249 18.1249 14.4749 18.4749C14.1249 18.8249 13.6974 18.9999 13.1922 18.9999H1.80768ZM9 5.99993V1.49996H1.80768C1.73075 1.49996 1.66023 1.53202 1.59612 1.59612C1.53202 1.66023 1.49996 1.73075 1.49996 1.80768V17.1922C1.49996 17.2692 1.53202 17.3397 1.59612 17.4038C1.66023 17.4679 1.73075 17.5 1.80768 17.5H13.1922C13.2692 17.5 13.3397 17.4679 13.4038 17.4038C13.4679 17.3397 13.5 17.2692 13.5 17.1922V5.99993H9ZM1.49996 1.49996V5.99993V17.1922V1.80768C1.49996 1.73075 1.49996 1.66023 1.49996 1.59612C1.49996 1.53202 1.49996 1.49996 1.49996 1.49996Z" fill={palette.darkRed} />
      </Svg>
    );
  }

  return (
    <Svg height={30} viewBox="0 0 17 15" width={30}>
      <Path d="M0 9.49996V8H7V9.49996H0V9.49996M0 5.49996V4H11V5.49996H0V5.49996M0 1.49996V0H11V1.49996H0V1.49996M8.61536 14.9999V12.3577L14.0442 6.95381C14.1686 6.82945 14.3028 6.74196 14.447 6.69132C14.5911 6.64068 14.7353 6.61536 14.8794 6.61536C15.0367 6.61536 15.1888 6.64484 15.3357 6.70382C15.4827 6.76279 15.6163 6.85125 15.7365 6.9692L16.6615 7.90381C16.7692 8.02817 16.8525 8.16278 16.9115 8.30765C16.9704 8.45252 16.9999 8.59739 16.9999 8.74226C16.9999 8.88713 16.973 9.03456 16.9192 9.18456C16.8653 9.33455 16.7794 9.47173 16.6615 9.59609L11.2576 14.9999H8.61536V14.9999M15.8076 8.74226V8.74226L14.8826 7.80764V7.80764L15.8076 8.74226V8.74226M9.80764 13.8076H10.7576L14.0038 10.5461L13.5442 10.0711L13.0788 9.60186L9.80764 12.8576V13.8076V13.8076M13.5442 10.0711L13.0788 9.60186V9.60186L14.0038 10.5461V10.5461L13.5442 10.0711V10.0711" fill={palette.darkRed} />
    </Svg>
  );
}

function TrustBadgeIcon() {
  return (
    <Svg height={18} viewBox="0 0 13 13" width={18}>
      <Path d="M4.43333 12.25L3.325 10.3833L1.225 9.91667L1.42917 7.75833L0 6.125L1.42917 4.49167L1.225 2.33333L3.325 1.86667L4.43333 0L6.41667 0.845833L8.4 0L9.50833 1.86667L11.6083 2.33333L11.4042 4.49167L12.8333 6.125L11.4042 7.75833L11.6083 9.91667L9.50833 10.3833L8.4 12.25L6.41667 11.4042L4.43333 12.25V12.25M5.80417 8.19583L9.1 4.9L8.28333 4.05417L5.80417 6.53333L4.55 5.30833L3.73333 6.125L5.80417 8.19583V8.19583" fill={palette.gold} />
    </Svg>
  );
}
function ApplicationDateField({ label, onPress, value }: { label: string; onPress: () => void; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.dateInput, pressed && styles.pressed]}>
        <Text style={[styles.dateText, !value && styles.selectPlaceholder]}>{value || "Chọn ngày sinh"}</Text>
        <Ionicons name="calendar-outline" size={22} color={palette.darkRed} />
      </Pressable>
    </View>
  );
}

function ApplicationBirthDateModal({ onClose, onSelect, value, visible }: { onClose: () => void; onSelect: (value: string) => void; value: string; visible: boolean }) {
  const initialDate = parseBirthDate(value) ?? new Date(2000, 0, 1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [displayMonth, setDisplayMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const cells = applicationCalendarCells(displayMonth);
  const selectedValue = formatBirthDateValue(selectedDate);
  const today = new Date();

  function openCurrentValue() {
    const nextDate = parseBirthDate(value) ?? selectedDate;
    setSelectedDate(nextDate);
    setDisplayMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }

  function shiftMonth(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function shiftYear(offset: number) {
    setDisplayMonth((current) => new Date(current.getFullYear() + offset, current.getMonth(), 1));
  }

  return (
    <Modal animationType="fade" onShow={openCurrentValue} onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.dateModalBackdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.dateModal}>
          <View style={styles.dateModalHeader}>
            <View>
              <Text style={styles.dateModalTitle}>Chọn ngày sinh</Text>
              <Text style={styles.dateModalSubtitle}>{selectedValue}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.dateModalClose}>
              <Ionicons name="close" size={22} color={palette.darkRed} />
            </Pressable>
          </View>

          <View style={styles.calendarNavRow}>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(-1)} style={styles.calendarNavButton}>
              <Ionicons name="play-back" size={16} color={palette.darkRed} />
            </Pressable>
            <Text style={styles.calendarNavTitle}>Năm {displayMonth.getFullYear()}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftYear(1)} style={styles.calendarNavButton}>
              <Ionicons name="play-forward" size={16} color={palette.darkRed} />
            </Pressable>
          </View>

          <View style={styles.calendarNavRow}>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(-1)} style={styles.calendarNavButton}>
              <Ionicons name="chevron-back" size={20} color={palette.darkRed} />
            </Pressable>
            <Text style={styles.calendarNavTitle}>Tháng {displayMonth.getMonth() + 1}</Text>
            <Pressable accessibilityRole="button" onPress={() => shiftMonth(1)} style={styles.calendarNavButton}>
              <Ionicons name="chevron-forward" size={20} color={palette.darkRed} />
            </Pressable>
          </View>

          <View style={styles.calendarWeekdays}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <Text key={day} style={styles.calendarWeekday}>{day}</Text>)}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((day, index) => {
              const date = day ? new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day) : null;
              const dateValue = date ? formatBirthDateValue(date) : "";
              const selected = dateValue === selectedValue;
              const disabled = date ? date > today : false;

              return (
                <View key={`${dateValue || "empty"}-${index}`} style={styles.calendarDayCell}>
                  {day ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={() => setSelectedDate(date as Date)}
                      style={[styles.calendarDay, selected && styles.calendarDaySelected, disabled && styles.calendarDayDisabled]}
                    >
                      <Text style={[styles.calendarDayText, selected && styles.calendarDayTextSelected, disabled && styles.calendarDayTextDisabled]}>{day}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.dateModalActions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.dateCancelButton}>
              <Text style={styles.dateCancelText}>Hủy</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onSelect(selectedValue)} style={styles.dateConfirmButton}>
              <Text style={styles.dateConfirmText}>Chọn ngày</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
function ApplicationSelect({ label, onPress, placeholder, value }: { label: string; onPress: () => void; placeholder: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.selectInput, pressed && styles.pressed]}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={22} color={palette.darkRed} />
      </Pressable>
    </View>
  );
}
function ApplicationInput({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#7b8494" style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.background, flex: 1 },
  header: { alignItems: "center", backgroundColor: palette.white, borderBottomColor: "rgba(0,0,0,0.06)", borderBottomWidth: 1, flexDirection: "row", height: 72, justifyContent: "space-between", paddingHorizontal: 20 },
  headerButton: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  headerTitle: { color: palette.darkRed, fontFamily: appFonts.bold, fontSize: 32, lineHeight: 40 },
  headerAvatar: { alignItems: "center", backgroundColor: "#f4e6e3", borderColor: palette.border, borderRadius: 999, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  headerAvatarText: { color: palette.darkRed, fontFamily: appFonts.bold, fontSize: 18 },
  scroll: { gap: 24, padding: 22, paddingBottom: 48 },
  hero: { gap: 12, paddingTop: 28 },
  eyebrow: { color: palette.gold, fontFamily: appFonts.bold, fontSize: 16, letterSpacing: 1.2, lineHeight: 22 },
  title: { color: palette.darkRed, fontFamily: appFonts.bold, fontSize: 40, lineHeight: 48 },
  description: { color: palette.brown, fontFamily: appFonts.regular, fontSize: 22, lineHeight: 34 },
  card: { backgroundColor: palette.white, borderColor: "rgba(225,227,228,0.8)", borderRadius: 18, borderWidth: 1, gap: 22, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: 14 },
  cardTitle: { color: palette.text, flex: 1, fontFamily: appFonts.bold, fontSize: 30, lineHeight: 38 },
  cardBody: { gap: 18 },
  field: { gap: 8 },
  label: { color: palette.brown, fontFamily: appFonts.bold, fontSize: 14, letterSpacing: 1.3, lineHeight: 20 },
  input: { borderColor: palette.border, borderRadius: 12, borderWidth: 1, color: palette.text, fontFamily: appFonts.regular, fontSize: 18, minHeight: 56, paddingHorizontal: 16, paddingVertical: 12 },
  textarea: { minHeight: 150, textAlignVertical: "top" },
  dateInput: { alignItems: "center", borderColor: palette.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", minHeight: 56, paddingHorizontal: 16, paddingVertical: 12 },
  dateText: { color: palette.text, flex: 1, fontFamily: appFonts.regular, fontSize: 18, lineHeight: 26 },
  selectInput: { alignItems: "center", borderColor: palette.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", minHeight: 56, paddingHorizontal: 16, paddingVertical: 12 },
  selectText: { color: palette.text, flex: 1, fontFamily: appFonts.regular, fontSize: 18, lineHeight: 26 },
  selectPlaceholder: { color: palette.placeholder },
  dateModalBackdrop: { backgroundColor: "rgba(25,28,29,0.42)", flex: 1, justifyContent: "flex-end", padding: 20 },
  dateModal: { backgroundColor: palette.white, borderRadius: 18, gap: 14, padding: 20 },
  dateModalHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  dateModalTitle: { color: palette.text, fontFamily: appFonts.bold, fontSize: 22, lineHeight: 30 },
  dateModalSubtitle: { color: palette.brown, fontFamily: appFonts.regular, fontSize: 15, lineHeight: 22 },
  dateModalClose: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  calendarNavRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  calendarNavButton: { alignItems: "center", backgroundColor: "#f7e8e5", borderRadius: 10, height: 38, justifyContent: "center", width: 42 },
  calendarNavTitle: { color: palette.darkRed, fontFamily: appFonts.bold, fontSize: 18, lineHeight: 26 },
  calendarWeekdays: { flexDirection: "row" },
  calendarWeekday: { color: palette.brown, flex: 1, fontFamily: appFonts.bold, fontSize: 13, lineHeight: 18, textAlign: "center" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  calendarDayCell: { alignItems: "center", width: "14.2857%" },
  calendarDay: { alignItems: "center", borderRadius: 999, height: 36, justifyContent: "center", width: 36 },
  calendarDaySelected: { backgroundColor: palette.darkRed },
  calendarDayDisabled: { opacity: 0.28 },
  calendarDayText: { color: palette.text, fontFamily: appFonts.bold, fontSize: 15, lineHeight: 20 },
  calendarDayTextSelected: { color: palette.white },
  calendarDayTextDisabled: { color: palette.muted },
  dateModalActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  dateCancelButton: { borderColor: palette.border, borderRadius: 12, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10 },
  dateCancelText: { color: palette.brown, fontFamily: appFonts.bold, fontSize: 15, lineHeight: 22 },
  dateConfirmButton: { backgroundColor: palette.darkRed, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  dateConfirmText: { color: palette.white, fontFamily: appFonts.bold, fontSize: 15, lineHeight: 22 },  positionModalBackdrop: { backgroundColor: "rgba(25,28,29,0.42)", flex: 1, justifyContent: "flex-end", padding: 20 },
  positionModal: { backgroundColor: palette.white, borderRadius: 18, gap: 16, padding: 20 },
  positionModalHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  positionModalTitle: { color: palette.text, fontFamily: appFonts.bold, fontSize: 22, lineHeight: 30 },
  positionModalClose: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  positionModalList: { gap: 10 },
  positionOption: { alignItems: "center", borderColor: "rgba(225,227,228,0.9)", borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 54, paddingHorizontal: 14, paddingVertical: 12 },
  positionOptionActive: { backgroundColor: "#f7e8e5", borderColor: palette.border },
  positionOptionText: { color: palette.text, flex: 1, fontFamily: appFonts.bold, fontSize: 16, lineHeight: 24 },
  positionOptionTextActive: { color: palette.darkRed },
  uploadBox: { alignItems: "center", borderColor: palette.border, borderRadius: 16, borderStyle: "dashed", borderWidth: 2, gap: 12, paddingHorizontal: 18, paddingVertical: 34 },
  uploadTitle: { color: palette.text, fontFamily: appFonts.bold, fontSize: 18, lineHeight: 26, textAlign: "center" },
  uploadHint: { color: palette.brown, fontFamily: appFonts.regular, fontSize: 16, lineHeight: 24, textAlign: "center" },
  fileButton: { borderColor: palette.darkRed, borderRadius: 12, borderWidth: 1, marginTop: 8, paddingHorizontal: 34, paddingVertical: 12 },
  fileButtonText: { color: palette.darkRed, fontFamily: appFonts.bold, fontSize: 16, lineHeight: 22 },
  submitButton: { alignItems: "center", backgroundColor: palette.darkRed, borderRadius: 16, flexDirection: "row", gap: 12, justifyContent: "center", minHeight: 62, paddingHorizontal: 20 },
  submitText: { color: palette.white, fontFamily: appFonts.bold, fontSize: 20, lineHeight: 28 },
  secureRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" },
  secureText: { color: palette.gold, fontFamily: appFonts.bold, fontSize: 13, letterSpacing: 0.8, lineHeight: 20, textAlign: "center" },
  pressed: { opacity: 0.78 }
});
