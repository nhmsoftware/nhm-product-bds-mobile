import { StyleSheet } from "react-native";
import { employeePalette } from "@/libs/employee-theme";
import { appFonts } from "@/libs/typography";
import { EMPLOYEE_HEADER_HEIGHT } from "@/components/EmployeeUI";
import { inventoryLotCellSize, inventoryLotGridHorizontalPadding } from "./constants";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  commentTimeText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  },
  commentsComposer: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  commentsInput: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 88,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  commentsSendButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: employeePalette.redDark,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 16
  },
  commentsSendText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20
  },
  notificationSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  notificationHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20
  },
  notificationBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  notificationHeaderTitle: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  notificationHeaderSpacer: {
    flex: 1
  },
  notificationRoot: {
    backgroundColor: "#f9f9fc",
    flex: 1
  },
  notificationScroll: {
    paddingBottom: 96
  },
  notificationTabs: {
    backgroundColor: "#f3f3f6",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 4
  },
  notificationTab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  notificationTabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  notificationTabText: {
    color: "#434653",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20
  },
  notificationTabTextActive: {
    color: "#950100",
    fontWeight: "600"
  },
  notificationList: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 24
  },
  notificationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16
  },
  notificationCardRead: {
    backgroundColor: "#f3f3f6",
    opacity: 0.8
  },
  notificationCardTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  notificationTitle: {
    color: "#1a1c1e",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
    paddingRight: 10
  },
  notificationTitleRead: {
    fontFamily: appFonts.semiBold,
    fontWeight: "600"
  },
  notificationUnreadDot: {
    backgroundColor: "#950100",
    borderRadius: 999,
    height: 10,
    marginTop: 4,
    width: 10
  },
  notificationReadAllButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  notificationStateText: {
    color: "#737784",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  notificationBody: {
    color: "#434653",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 4
  },
  notificationMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 12
  },
  notificationTime: {
    color: "#737784",
    fontFamily: appFonts.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.55,
    lineHeight: 16.5
  },
  notificationMetaDot: {
    backgroundColor: "#c3c6d5",
    borderRadius: 999,
    height: 4,
    width: 4
  },
  notificationCategory: {
    fontFamily: appFonts.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.55,
    lineHeight: 16.5
  },
  notificationCategoryGold: {
    color: "#805600"
  },
  notificationCategoryRed: {
    color: "#950100"
  },
  notificationCategoryRead: {
    color: "#737784"
  },
  pointHistorySafe: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  pointHistoryHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 2
  },
  pointHistoryBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  pointHistoryHeaderTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  pointHistoryHeaderSpacer: {
    height: 36,
    width: 36
  },
  pointHistoryContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  pointHistoryHero: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderColor: "rgba(106, 1, 0, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 190,
    overflow: "hidden",
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  pointHistoryHeroGlowTop: {
    backgroundColor: "rgba(238, 192, 91, 0.1)",
    borderRadius: 999,
    height: 128,
    position: "absolute",
    right: -64,
    top: -64,
    width: 128
  },
  pointHistoryHeroGlowBottom: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 999,
    bottom: -48,
    height: 96,
    left: -48,
    position: "absolute",
    width: 96
  },
  pointHistoryHeroEyebrow: {
    color: "#ffdf9f",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    paddingBottom: 8,
    textAlign: "center"
  },
  pointHistoryHeroValue: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 56,
    letterSpacing: -2.8,
    lineHeight: 56,
    paddingBottom: 8,
    textAlign: "center"
  },
  pointHistoryRankPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  pointHistoryRankText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.8,
    lineHeight: 22
  },
  pointHistoryStatsGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16
  },
  pointHistoryStatCard: {
    backgroundColor: "#ffffff",
    borderColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "space-between",
    minHeight: 86,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2
  },
  pointHistoryStatLabel: {
    color: "#a3a3a3",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  pointHistoryMonthRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  pointHistoryMonthValue: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  pointHistoryMonthGrowth: {
    color: "#16a34a",
    fontFamily: appFonts.bold,
    fontSize: 10,
    lineHeight: 15
  },
  pointHistoryProgressTrack: {
    backgroundColor: "#f5f5f5",
    borderRadius: 999,
    height: 6,
    marginTop: 13,
    overflow: "hidden",
    width: "100%"
  },
  pointHistoryProgressFill: {
    backgroundColor: "#eec05b",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  pointHistoryTargetText: {
    color: "#525252",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4
  },
  pointHistorySectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 18
  },
  pointHistoryList: {
    gap: 12,
    marginTop: 16
  },
  pointHistoryEmpty: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#f0e7e4",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
    paddingHorizontal: 18,
    paddingVertical: 24
  },
  pointHistoryEmptyTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center"
  },
  pointHistoryEmptyText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center"
  },
  pointHistoryItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 74,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2
  },
  pointHistoryItemDimmed: {
    opacity: 0.7
  },
  pointHistoryItemTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 20
  },
  pointHistoryItemTime: {
    color: "#a3a3a3",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  pointHistoryPoints: {
    alignItems: "flex-end"
  },
  pointHistoryPointsValue: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "right"
  },
  pointHistoryPointsUnit: {
    color: "#a3a3a3",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "right"
  },
  certificatesSafe: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  certificatesHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 2
  },
  certificatesHeaderButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  certificatesHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    includeFontPadding: true,
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  certificatesHeaderSpacer: {
    height: 36,
    width: 36
  },
  certificatesContent: {
    gap: 16,
    paddingBottom: 96,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  certificatesHero: {
    backgroundColor: "#6a0100",
    borderRadius: 12,
    minHeight: 204,
    padding: 24
  },
  certificatesHeroTitle: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    lineHeight: 34
  },
  certificatesHeroText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 26,
    marginTop: 8,
    maxWidth: 272
  },
  certificatesHeroStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24
  },
  certificatesHeroBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    minWidth: 104,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  certificatesHeroBadgeValue: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 24,
    includeFontPadding: true,
    lineHeight: 34
  },
  certificatesHeroBadgeLabel: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18,
    marginTop: 2
  },
  certificatesLevelCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#f4f4f5",
    borderRadius: 12,
    borderWidth: 1,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  certificatesLevelIcon: {
    alignItems: "center",
    backgroundColor: "#ffdf9f",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    marginBottom: 15,
    width: 64
  },
  certificatesLevelLabel: {
    color: "#795900",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18,
    textAlign: "center"
  },
  certificatesLevelTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 34,
    marginTop: 4,
    textAlign: "center"
  },
  certificatesSearchBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 13
  },
  certificatesSearchText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24,
    paddingVertical: 0
  },
  certificatesFilterButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 17
  },
  certificatesFilterButtonActive: {
    backgroundColor: "#fff7f6",
    borderColor: employeePalette.redDark
  },
  certificatesFilterText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24
  },
  certificatesFilterTextActive: {
    color: employeePalette.redDark
  },
  certificatesFilterBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  certificatesFilterModal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%"
  },
  certificatesFilterModalHeader: {
    alignItems: "center",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  certificatesFilterModalTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  certificatesFilterCloseButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  certificatesFilterModalList: {
    padding: 12
  },
  certificatesFilterOption: {
    alignItems: "center",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  certificatesFilterOptionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  certificatesFilterOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10
  },
  certificatesFilterOptionTextActive: {
    color: employeePalette.goldDark
  },
  certificatesList: {
    gap: 20,
    marginTop: 4
  },
  certificatesCard: {
    backgroundColor: "#ffffff",
    borderColor: "#f4f4f5",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  certificatesImageWrap: {
    height: 192,
    overflow: "hidden",
    width: "100%"
  },
  certificatesImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  certificatesVerifiedPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#f4f4f5",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    position: "absolute",
    right: 16,
    top: 16
  },
  certificatesVerifiedText: {
    color: "#15803d",
    fontFamily: appFonts.bold,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 16
  },
  certificatesCardBody: {
    padding: 24
  },
  certificatesCardTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  certificatesCardTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 18,
    includeFontPadding: true,
    lineHeight: 28
  },
  certificatesNewBadge: {
    backgroundColor: "#fffbeb",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  certificatesNewBadgeText: {
    color: "#b45309",
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  certificatesProvider: {
    color: "#71717a",
    fontFamily: appFonts.regular,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 22,
    marginTop: 4
  },
  certificatesDivider: {
    backgroundColor: "#f4f4f5",
    height: 1,
    marginVertical: 24
  },
  certificatesDateLabel: {
    color: "#a1a1aa",
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  certificatesDate: {
    color: "#000000",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 22
  },
  certificatesFab: {
    alignItems: "center",
    backgroundColor: "#7f1d1d",
    borderRadius: 999,
    bottom: 46,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    width: 56,
    elevation: 4
  },
  leaveSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  leaveHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 2
  },
  leaveHeaderButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  leaveHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 8
  },
  leaveRoot: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  leaveScrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 17,
    paddingTop: 20
  },
  leaveIntro: {
    gap: 7,
    marginBottom: 56
  },
  leaveIntroCompact: {
    gap: 7,
    marginBottom: 20
  },
  leaveTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  leaveSubtitle: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  leaveFormCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginBottom: 24,
    padding: 17,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20
  },
  leaveFormTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 24
  },
  leaveTypeButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    height: 50,
    justifyContent: "space-between",
    paddingHorizontal: 17
  },
  leaveTypeButtonText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  leaveSubmitButton: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    height: 50,
    justifyContent: "center",
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 3
  },
  leaveSubmitText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  leaveHistoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  transferHistoryHeader: {
    marginTop: 28
  },
  leaveHistoryTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  leaveHistoryMeta: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 18
  },
  leaveFilterScroll: {
    marginBottom: 31,
    marginHorizontal: -17
  },
  leaveFilterContent: {
    gap: 8,
    paddingHorizontal: 17
  },
  leaveFilterChip: {
    alignItems: "center",
    backgroundColor: "#e7e8e9",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  leaveFilterChipActive: {
    backgroundColor: "#950100"
  },
  leaveFilterText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 22
  },
  leaveFilterTextActive: {
    color: "#ffffff"
  },
  leaveStateText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12
  },
  leaveList: {
    gap: 16
  },
  leaveCard: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 17,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20
  },
  leaveCardRejected: {
    opacity: 0.7
  },
  leaveCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  leaveHistoryCardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  leaveHistoryCardTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0
  },
  leaveHistoryCardTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  leavePerson: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0
  },
  leaveAvatar: {
    borderColor: "#e1e3e4",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    width: 48
  },
  leavePersonText: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 16
  },
  leaveName: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  leaveDepartment: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  leaveBadge: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  leaveBadgePending: {
    backgroundColor: "#e7e8e9"
  },
  leaveBadgeApproved: {
    backgroundColor: "#fdce67"
  },
  leaveBadgeRejected: {
    backgroundColor: "#ffdad6"
  },
  leaveBadgeText: {
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 18
  },
  leaveBadgePendingText: {
    color: "#5b403c"
  },
  leaveBadgeApprovedText: {
    color: "#755700"
  },
  leaveBadgeRejectedText: {
    color: "#93000a"
  },
  leaveDetailBox: {
    backgroundColor: "#ffffff",
    borderColor: "#edeeef",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  leaveDetailBoxPressable: {
    minHeight: 88
  },
  leaveDetailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  leaveDateText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 16
  },
  leaveReasonText: {
    color: "#5b403c",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 20
  },
  leaveActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  leaveApproveButton: {
    alignItems: "center",
    backgroundColor: "#1e8e3e",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    width: 108
  },
  leaveApproveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 22
  },
  leaveRejectButton: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48
  },
  leaveRejectText: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.32,
    lineHeight: 22
  },
  leaveCancelButton: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center"
  },
  leaveCancelText: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 18
  },
  leaveTypeModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: "100%"
  },
  leaveTypeModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  leaveTypeModalTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  leaveTypeModalList: {
    gap: 8
  },
  leaveTypeOption: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  leaveTypeOptionActive: {
    backgroundColor: "#ffdad4",
    borderColor: "#950100"
  },
  leaveTypeOptionText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 20
  },
  leaveTypeOptionTextActive: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold
  },
  transferCreateContent: {
    paddingBottom: 48,
    paddingHorizontal: 17,
    paddingTop: 20
  },
  transferCreateCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e1e3e4",
    borderRadius: 12,
    borderWidth: 1,
    gap: 18,
    padding: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  transferCurrentDepartmentBox: {
    alignItems: "center",
    backgroundColor: "#fff7f6",
    borderColor: "#ffdad6",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14
  },
  transferCurrentDepartmentLabel: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 14
  },
  transferCurrentDepartmentText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 2
  },
  transferField: {
    gap: 8
  },
  transferLabel: {
    color: "#5b403c",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    lineHeight: 16
  },
  transferInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  transferDepartmentSelect: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14
  },
  transferDepartmentSelectDisabled: {
    opacity: 0.65
  },
  transferDepartmentSelectText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21
  },
  transferDepartmentPlaceholder: {
    color: "#9ca3af"
  },
  transferHelperText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18
  },
  transferTextArea: {
    minHeight: 112
  },
  transferDateInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14
  },
  transferDateText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21
  },
  transferSubmitButton: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 50,
    justifyContent: "center",
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 3
  },
  transferSubmitText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  transferRejectOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(25,28,29,0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  transferRejectModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: "100%"
  },
  departmentPickerModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    maxHeight: "78%",
    padding: 20,
    width: "100%"
  },
  departmentPickerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14
  },
  departmentPickerTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  departmentPickerSubtitle: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  departmentPickerList: {
    gap: 8
  },
  departmentPickerOption: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  departmentPickerOptionActive: {
    backgroundColor: "#ffdad4",
    borderColor: "#950100"
  },
  departmentPickerOptionText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 20
  },
  departmentPickerOptionTextActive: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold
  },
  transferRejectTitle: {
    color: "#191c1d",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 26
  },
  transferRejectSubtitle: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  transferRejectInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e3e4",
    borderRadius: 10,
    borderWidth: 1,
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top"
  },
  transferRejectActions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4
  },
  transferRejectCancel: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: "center"
  },
  transferRejectCancelText: {
    color: "#5b403c",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 18
  },
  transferRejectConfirm: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 10,
    flex: 1,
    height: 46,
    justifyContent: "center"
  },
  transferRejectConfirmText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 18
  },
  staffSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  staffHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 2
  },
  staffHeaderButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  staffHeaderTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28,
    textAlign: "center"
  },
  staffRoot: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  staffScrollContent: {
    gap: 32,
    paddingBottom: 176,
    paddingHorizontal: 20,
    paddingTop: 26
  },
  staffDepartmentCard: {
    backgroundColor: "#950100",
    borderRadius: 12,
    overflow: "hidden",
    padding: 32,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8
  },
  staffDepartmentGlow: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 128,
    height: 256,
    position: "absolute",
    right: -32,
    top: -32,
    width: 256
  },
  staffDepartmentLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  staffDepartmentLabel: {
    color: "#ffb4a8",
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  staffDepartmentTitle: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.96,
    lineHeight: 38.4,
    marginBottom: 8
  },
  staffDepartmentDescription: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    opacity: 0.9
  },
  staffDepartmentMetaGroup: {
    gap: 16,
    paddingTop: 17
  },
  staffDepartmentMeta: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    height: 36,
    paddingHorizontal: 16
  },
  staffDepartmentMetaText: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  staffFilterSection: {
    gap: 8,
    paddingTop: 8
  },
  staffFilterLabel: {
    color: "#5b403c",
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 16
  },
  staffInputFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16
  },
  staffInput: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0
  },
  staffSelectFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16
  },
  staffSelectText: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  staffStateText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20
  },
  staffList: {
    gap: 26
  },
  staffEmptyState: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 48
  },
  staffEmptyTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    textAlign: "center"
  },
  staffEmptyDescription: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center"
  },
  staffCard: {
    backgroundColor: "#ffffff",
    borderColor: "#f4f4f5",
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20
  },
  staffName: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 28
  },
  staffRole: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  staffActions: {
    flexDirection: "row",
    gap: 14,
    paddingTop: 24
  },
  staffCallButton: {
    alignItems: "center",
    borderColor: "#6a0100",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 40
  },
  staffCallText: {
    color: "#6a0100",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  staffZaloButton: {
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 40
  },
  staffZaloText: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  documentViewerSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  documentViewerHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f5f5f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  documentViewerHeaderButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38
  },
  documentViewerTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center"
  },
  documentViewerBody: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  documentViewerImage: {
    height: "100%",
    width: "100%"
  },
  documentViewerWebView: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  documentViewerMessage: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    padding: 20,
    textAlign: "center"
  },
  personalSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  personalHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f5f5f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2
  },
  personalHeaderButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.45,
    lineHeight: 28
  },
  personalRoot: {
    backgroundColor: "#f8f9fa",
    flex: 1
  },
  personalScroll: {
    paddingBottom: 128,
    paddingHorizontal: 20,
    paddingTop: 32
  },
  personalIdentity: {
    alignItems: "center",
    gap: 4,
    marginBottom: 48
  },
  personalAvatarWrap: {
    alignItems: "center",
    height: 128,
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    width: 128
  },
  personalAvatarFrame: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderColor: "#ffffff",
    borderRadius: 64,
    borderWidth: 4,
    height: 128,
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    width: 128
  },
  personalAvatarImage: {
    borderRadius: 60,
    height: "100%",
    width: "100%"
  },
  personalAvatarFallback: {
    alignItems: "center",
    borderRadius: 60,
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  personalAvatarInitial: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 40,
    lineHeight: 48
  },
  personalEditAvatar: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 999,
    bottom: 4,
    elevation: 6,
    height: 26.5,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: 26.5,
    zIndex: 2
  },
  personalName: {
    color: "#6a0100",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center"
  },
  personalRole: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 24,
    textAlign: "center"
  },
  personalAwardPill: {
    backgroundColor: "#ffdad4",
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  personalAwardText: {
    color: "#6a0100",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    lineHeight: 16
  },
  personalSectionGrid: {
    gap: 16
  },
  personalSection: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227,190,184,0.3)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 25,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15
  },
  personalSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  personalSectionTitle: {
    color: "#6a0100",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  personalSectionBody: {
    gap: 16
  },
  personalField: {
    gap: 4
  },
  personalFieldLabel: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  personalInputBox: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 17,
    paddingVertical: 13
  },
  personalInputText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    padding: 0
  },
  personalDateInputBox: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingVertical: 9
  },
  personalDateText: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 24
  },
  personalDatePlaceholder: {
    color: "#8f706b",
    fontFamily: appFonts.regular
  },
  personalDateHint: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    paddingTop: 2
  },
  personalDateIconButton: {
    alignItems: "center",
    backgroundColor: "#ffdad4",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalDateOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(25, 28, 29, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  personalDateModal: {
    backgroundColor: "#ffffff",
    borderColor: "#e3beb8",
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 360,
    padding: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "100%",
    elevation: 8
  },
  personalDateModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  personalDateModalTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    lineHeight: 28
  },
  personalDateModalSubtitle: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2
  },
  personalDateCloseButton: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalCalendarYearRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 18
  },
  personalCalendarYearText: {
    color: "#950100",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 24
  },
  personalCalendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  personalCalendarTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 26
  },
  personalCalendarNavButton: {
    alignItems: "center",
    backgroundColor: "#fff4f2",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  personalCalendarWeekdays: {
    flexDirection: "row",
    paddingTop: 14
  },
  personalCalendarWeekday: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    width: "14.2857%"
  },
  personalCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 8
  },
  personalCalendarDayCell: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: "14.2857%"
  },
  personalCalendarDay: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  personalCalendarDayToday: {
    borderColor: "#eec05b",
    borderWidth: 1
  },
  personalCalendarDaySelected: {
    backgroundColor: "#950100"
  },
  personalCalendarDayText: {
    color: "#191c1d",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  personalCalendarDayTextSelected: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold
  },
  personalDateActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 18
  },
  personalDateCancelButton: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: "center"
  },
  personalDateCancelText: {
    color: "#5b403c",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 20
  },
  personalDateConfirmButton: {
    alignItems: "center",
    backgroundColor: "#950100",
    borderRadius: 12,
    flex: 1,
    height: 46,
    justifyContent: "center",
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3
  },
  personalDateConfirmText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    lineHeight: 20
  },
  personalInputDisabled: {
    color: "#8f706b"
  },
  personalInlineInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  personalStatusText: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  personalTextArea: {
    minHeight: 72,
    textAlignVertical: "top"
  },
  personalEducationBlock: {
    gap: 16
  },
  personalEducation: {
    gap: 2
  },
  personalMiniLabel: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textTransform: "uppercase"
  },
  personalEducationTitle: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2
  },
  personalEducationText: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 220
  },
  personalExperience: {
    borderTopColor: "rgba(227,190,184,0.2)",
    borderTopWidth: 1,
    gap: 7,
    paddingTop: 14
  },
  personalExperienceList: {
    gap: 8
  },
  personalExperienceItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  personalExperienceDot: {
    borderRadius: 999,
    height: 6,
    marginTop: 7,
    width: 6
  },
  personalExperienceCopy: {
    flex: 1
  },
  personalExperienceCompany: {
    color: "#191c1d",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 16
  },
  personalExperienceMeta: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  personalDocRow: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: "rgba(227,190,184,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 13
  },
  personalDocTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0
  },
  personalDocTitle: {
    color: "#191c1d",
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20
  },
  personalDocActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingLeft: 10
  },
  personalDocActionButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34
  },
  personalUploadButton: {
    alignItems: "center",
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 2,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 14
  },
  personalUploadText: {
    color: "#5b403c",
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  personalSaveWrap: {
    alignItems: "center",
    paddingTop: 48
  },
  personalSaveButton: {
    alignItems: "center",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 51,
    paddingHorizontal: 64,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15
  },
  personalSaveText: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  metricRow: {
    flexDirection: "row",
    gap: 12
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  twoButtons: {
    flexDirection: "row",
    gap: 12
  },
  learningContent: {
    gap: 24,
    paddingTop: 24
  },
  learningSection: {
    gap: 16,
    paddingVertical: 24
  },
  learningSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  learningSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 30
  },
  learningDetailLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 32
  },
  learningDetailText: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningPathList: {
    gap: 16
  },
  learningPathCard: {
    alignItems: "flex-start",
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 92,
    overflow: "hidden",
    padding: 16
  },
  learningPathGlow: {
    backgroundColor: "#ffdf9f",
    borderRadius: 999,
    height: 96,
    position: "absolute",
    right: -24,
    top: -24,
    width: 96
  },
  learningPathGlowDefault: {
    opacity: 0.2
  },
  learningPathGlowActive: {
    opacity: 0.4
  },
  learningPathCardActive: {
    borderColor: employeePalette.gold
  },
  learningPathCardLocked: {
    opacity: 0.7
  },
  learningPathIcon: {
    alignItems: "center",
    backgroundColor: "#edeeef",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  learningPathIconActive: {
    backgroundColor: "#ffdf9f"
  },
  learningPathTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5
  },
  learningPathDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19.5,
    paddingBottom: 8
  },
  learningProgressTrack: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
    width: "100%"
  },
  learningProgressFill: {
    backgroundColor: employeePalette.gold,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  learningProgressFillActive: {
    backgroundColor: employeePalette.goldDark
  },
  learningTabs: {
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 24,
    minHeight: 33
  },
  learningTabActive: {
    borderBottomColor: employeePalette.redDark,
    borderBottomWidth: 2,
    color: employeePalette.redDark,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    paddingBottom: 8
  },
  learningTab: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22.5,
    paddingBottom: 8
  },
  learningCourseList: {
    gap: 24
  },
  learningEmptyText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningCourseCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden"
  },
  learningCourseImageWrap: {
    backgroundColor: "#edeeef",
    height: 180,
    overflow: "hidden",
    width: "100%"
  },
  learningCourseImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  learningRequiredPill: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#e3beb8",
    borderRadius: 999,
    borderWidth: 1,
    left: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
    top: 8
  },
  learningRequiredText: {
    color: employeePalette.redDark,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  learningCourseBody: {
    gap: 8,
    padding: 16
  },
  learningCourseTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 27
  },
  learningCourseDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  learningCourseProgressHeader: {
    alignItems: "center",
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 17
  },
  learningProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  learningProgressPercent: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  requiredLearningContent: {
    gap: 15,
    paddingTop: 24
  },
  requiredHero: {
    backgroundColor: "#e7e8e9",
    borderRadius: 12,
    height: 192,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    width: "100%",
    elevation: 1
  },
  requiredHeroImage: {
    height: "145.2%",
    resizeMode: "cover",
    top: "-22.6%",
    width: "100%"
  },
  requiredHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(25, 28, 29, 0.38)"
  },
  requiredHeroCopy: {
    bottom: 16,
    left: 16,
    position: "absolute",
    right: 16
  },
  requiredHeroKicker: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(25, 28, 29, 0.5)",
    borderColor: "rgba(255, 223, 159, 0.3)",
    borderWidth: 1,
    borderRadius: 999,
    color: "#fbe6a4",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    marginBottom: 6,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  requiredHeroTitle: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    maxWidth: 318
  },
  requiredIntro: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  requiredAlert: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 218, 214, 0.3)",
    borderColor: "#ffdad6",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 10
  },
  requiredAlertIcon: {
    alignItems: "center",
    backgroundColor: "#d42121",
    borderRadius: 999,
    height: 20,
    justifyContent: "center",
    marginTop: 2,
    width: 20
  },
  requiredAlertText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 21.13
  },
  requiredTimeline: {
    gap: 18,
    paddingBottom: 72,
    position: "relative"
  },
  requiredTimelineLine: {
    backgroundColor: "#e2e3e4",
    bottom: 0,
    left: 15,
    position: "absolute",
    top: 18,
    width: 2
  },
  requiredTimelineRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16
  },
  requiredTimelineNode: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    marginTop: 13,
    width: 28,
    zIndex: 2
  },
  requiredTimelineNodeActive: {
    backgroundColor: employeePalette.redDark,
    shadowColor: employeePalette.redDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3
  },
  requiredTimelineNodeLocked: {
    backgroundColor: "#ededed"
  },
  requiredLessonCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minHeight: 152,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2
  },
  requiredLessonCardLocked: {
    minHeight: 128,
    opacity: 0.65
  },
  requiredLessonHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requiredLessonStep: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold,
    fontSize: 14,
    letterSpacing: 1.2,
    lineHeight: 20
  },
  requiredLessonStatus: {
    backgroundColor: "#f1efef",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6
  },
  requiredLessonStatusText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18
  },
  requiredLessonTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 22
  },
  requiredLessonTitleLocked: {
    color: "#707477"
  },
  requiredLessonMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  requiredLessonDuration: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  requiredProgressTrack: {
    backgroundColor: "#e3e4e4",
    borderRadius: 999,
    height: 6,
    marginTop: 6,
    overflow: "hidden"
  },
  requiredProgressFill: {
    backgroundColor: employeePalette.redDark,
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  requiredProgressFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  requiredProgressText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19.5
  },
  requiredContinueText: {
    color: employeePalette.redDark,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 19.5
  },
  requiredQuizCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 14,
    minHeight: 147,
    paddingHorizontal: 16,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2
  },
  requiredQuizCardLocked: {
    opacity: 0.72
  },
  requiredQuizKicker: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 1.4,
    lineHeight: 18
  },
  requiredQuizTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 22
  },
  requiredQuizButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 16
  },
  requiredQuizButtonLocked: {
    backgroundColor: "#d8a1a2"
  },
  requiredQuizButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  requiredLessonMuted: {
    color: "#9d8d8a"
  },
  lessonHeaderRight: {
    width: 20
  },
  lessonDetailContent: {
    gap: 0,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  lessonVideo: {
    backgroundColor: "#000000",
    height: 280,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  lessonVideoImage: {
    height: "127.08%",
    opacity: 0.8,
    resizeMode: "cover",
    top: "-13.54%",
    width: "100%"
  },
  lessonVideoPlayer: {
    height: "100%",
    width: "100%"
  },
  lessonVideoMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  lessonNativeControls: {
    bottom: 10,
    gap: 8,
    left: 16,
    position: "absolute",
    right: 16
  },
  lessonNativeSeekTrack: {
    backgroundColor: "rgba(255, 255, 255, 0.32)",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
    paddingVertical: 3,
    width: "100%"
  },
  lessonNativeSeekTrackPressed: {
    opacity: 0.82
  },
  lessonNativeSeekTrackLocked: {
    opacity: 0.72
  },
  lessonVideoControlRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 2
  },
  lessonVideoSideSlot: {
    alignItems: "flex-end",
    minWidth: 48
  },
  lessonVideoButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center"
  },
  lessonVideoControlButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    height: 38,
    justifyContent: "center",
    minWidth: 68,
    paddingHorizontal: 12
  },
  lessonVideoControlButtonDisabled: {
    opacity: 0.42
  },
  lessonVideoPrimaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(149, 1, 0, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  lessonVideoFullscreenButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 42
  },
  lessonVideoSmallText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    lineHeight: 16
  },
  lessonVideoExternalButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  lessonVideoExternalText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 18
  },
  lessonVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.18)"
  },
  lessonCastButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    top: 16,
    width: 36
  },
  lessonPlayButton: {
    alignItems: "center",
    backgroundColor: "rgba(106, 1, 0, 0.86)",
    borderRadius: 999,
    height: 72,
    justifyContent: "center",
    left: "50%",
    marginLeft: -36,
    marginTop: -36,
    position: "absolute",
    top: "50%",
    width: 72
  },
  lessonVideoControls: {
    bottom: 16,
    gap: 8,
    left: 16,
    position: "absolute",
    right: 16
  },
  lessonVideoTime: {
    color: "#ffffff",
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  lessonSeekTrack: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 999,
    height: 4,
    overflow: "hidden"
  },
  lessonSeekFill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: "100%",
    opacity: 0.9
  },
  lessonControlRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8
  },
  lessonControlLeft: {
    flexDirection: "row",
    gap: 16
  },
  lessonDetailBody: {
    gap: 14,
    paddingBottom: 64,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  lessonBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffdad6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  lessonBadgeText: {
    color: "#410000",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  lessonDetailTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  lessonDetailDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonNotice: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    marginTop: 24,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  lessonNoticeCompleted: {
    backgroundColor: "#f7fbf8",
    borderColor: "rgba(19, 138, 67, 0.28)"
  },
  lessonNoticeRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12
  },
  lessonNoticeText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonNextButtonDisabled: {
    alignItems: "center",
    backgroundColor: "rgba(149, 1, 0, 0.4)",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    opacity: 0.7
  },
  lessonNextButtonActive: {
    alignItems: "center",
    backgroundColor: employeePalette.redDark,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    shadowColor: employeePalette.redDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3
  },
  lessonNextButtonPending: {
    opacity: 0.72
  },
  lessonNextButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1
  },
  lessonAttachmentsTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8,
    marginTop: 56
  },
  lessonAttachmentList: {
    gap: 8
  },
  lessonEmptyAttachments: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22
  },
  lessonAttachmentRow: {
    alignItems: "center",
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 82,
    padding: 17
  },
  lessonAttachmentIcon: {
    alignItems: "center",
    borderRadius: 4,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  lessonAttachmentIconPdf: {
    backgroundColor: "#ffdad6"
  },
  lessonAttachmentIconDoc: {
    backgroundColor: "#ffdf9f"
  },
  lessonAttachmentTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6
  },
  lessonAttachmentSize: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  divider: {
    backgroundColor: employeePalette.border,
    height: 1,
    marginVertical: 12
  },
  upperTitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 0.9,
    lineHeight: 18,
    textTransform: "uppercase"
  },
  meetSectionLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 18,
    textTransform: "uppercase"
  },
  meetField: {
    gap: 8
  },
  meetFieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  meetFieldInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 13,
    paddingVertical: 13
  },
  meetFieldValue: {
    color: employeePalette.muted,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  meetFieldTextInput: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 30,
    padding: 0
  },
  meetPersonIcon: {
    height: 13,
    resizeMode: "contain",
    width: 13
  },
  meetPhoneIcon: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  meetProjectIcon: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  meetDropdownIcon: {
    height: 5,
    resizeMode: "contain",
    width: 17
  },
  meetProjectModalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  meetProjectModal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    maxHeight: "70%",
    overflow: "hidden",
    width: "100%"
  },
  meetProjectModalHeader: {
    alignItems: "center",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  meetProjectModalTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  meetProjectModalClose: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  meetProjectModalList: {
    padding: 12
  },
  meetProjectModalOption: {
    alignItems: "center",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  meetProjectModalOptionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  meetProjectModalOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10
  },
  meetProjectModalOptionTextActive: {
    color: employeePalette.goldDark
  },
  projectChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  projectChip: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  projectChipActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  projectChipText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
    paddingTop: 1
  },
  projectChipTextActive: {
    color: employeePalette.goldDark
  },
  meetPhotoBox: {
    alignItems: "center",
    backgroundColor: "#eff0f1",
    borderColor: "#dfe3e6",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 8,
    minHeight: 210,
    justifyContent: "center",
    padding: 20
  },
  roundCamera: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: 64,
    elevation: 2
  },
  meetCameraEmptyIcon: {
    height: 22,
    resizeMode: "contain",
    width: 24
  },
  meetPhotoPreviewFrame: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    height: 220,
    overflow: "hidden",
    width: "100%"
  },
  meetPhotoPreview: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  photoTapText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 24
  },
  meetPhotoButton: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.red,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 51,
    paddingVertical: 17
  },
  meetCameraButtonIcon: {
    height: 17,
    resizeMode: "contain",
    width: 19
  },
  meetPhotoButtonText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  meetConfirmButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 56,
    shadowColor: employeePalette.red,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5
  },
  meetConfirmButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 17,
    letterSpacing: 0.2,
    lineHeight: 25
  },
  meetSeeAll: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  meetSeeAllText: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  meetForwardIcon: {
    height: 8,
    resizeMode: "contain",
    width: 5
  },
  meetRecentList: {
    gap: 8
  },
  meetingActivitiesHeader: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16
  },
  meetingActivitiesTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 26
  },
  meetingActivitiesSubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22
  },
  meetRecentStateText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: 8
  },
  meetRecentCard: {
    alignItems: "flex-start",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 88,
    padding: 17
  },
  meetRecentAvatar: {
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    resizeMode: "cover",
    width: 48
  },
  meetRecentCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  meetRecentName: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  meetRecentMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  meetRecentTimeIcon: {
    height: 12,
    resizeMode: "contain",
    width: 12
  },
  meetRecentLocationIcon: {
    height: 12,
    resizeMode: "contain",
    width: 9
  },
  meetRecentMetaText: {
    color: employeePalette.muted,
    flexShrink: 1,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 16
  },
  meetRecentStatus: {
    backgroundColor: "#e7e8e9",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  meetRecentStatusText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 16
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inlineStrong: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold
  },
  showingGpsCard: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 13
  },
  showingGpsIcon: {
    height: 22,
    resizeMode: "contain",
    width: 22
  },
  showingGpsCopy: {
    flex: 1
  },
  showingGpsText: {
    includeFontPadding: true,
    lineHeight: 22
  },
  showingForm: {
    gap: 16
  },
  showingField: {
    gap: 4
  },
  showingFieldLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  showingFieldInput: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: 17,
    paddingVertical: 10
  },
  showingFieldValue: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6
  },
  showingFieldTextInput: {
    flex: 1,
    includeFontPadding: true,
    minHeight: 34,
    padding: 0,
    paddingVertical: 2
  },
  showingFieldValueMuted: {
    color: "#6b7280"
  },
  showingChevronIcon: {
    height: 8,
    resizeMode: "contain",
    width: 12
  },
  showingPhotoHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  showingCameraIcon: {
    height: 23,
    resizeMode: "contain",
    width: 25
  },
  showingPhotoPreview: {
    borderRadius: 6,
    height: 72,
    resizeMode: "cover",
    width: 96
  },
  showingPrimaryButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingVertical: 12,
    shadowColor: employeePalette.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2
  },
  showingPlayIcon: {
    height: 14,
    resizeMode: "contain",
    width: 11
  },
  showingPrimaryButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  showingTimeline: {
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    gap: 0,
    paddingTop: 16,
    position: "relative"
  },
  showingTimelineLine: {
    backgroundColor: employeePalette.border,
    bottom: 16,
    left: 19,
    position: "absolute",
    top: 32,
    width: 2
  },
  showingTimelineItem: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 8
  },
  showingTimelineIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  showingTimelineIconActive: {
    borderColor: employeePalette.red
  },
  showingTimelineCheckAsset: {
    height: 17,
    resizeMode: "contain",
    width: 17
  },
  showingTimelineHistoryAsset: {
    height: 15,
    resizeMode: "contain",
    width: 15
  },
  showingTimelineCard: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  showingTimelineTime: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  showingTimelineBadge: {
    backgroundColor: "#ffdf9f",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  showingTimelineBadgeText: {
    color: "#261a00",
    fontFamily: appFonts.regular,
    fontSize: 10,
    includeFontPadding: true,
    lineHeight: 15
  },
  showingTimelineTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 21,
    paddingTop: 4
  },
  showingTimelineCustomer: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    includeFontPadding: true,
    lineHeight: 19.5
  },
  newsMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  linkText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 20
  },
  profileFigmaContent: {
    gap: 16,
    paddingBottom: 108,
    paddingTop: 24
  },
  profileHeroCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 272,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 27,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileHeroDecoration: {
    backgroundColor: "rgba(149, 1, 0, 0.05)",
    borderBottomLeftRadius: 100,
    height: 128,
    position: "absolute",
    right: -32,
    top: -32,
    width: 128
  },
  profileHeroAvatar: {
    borderColor: "#ffffff",
    borderRadius: 48,
    borderWidth: 4,
    height: 96,
    resizeMode: "cover",
    width: 96
  },
  profileHeroAvatarButton: {
    borderRadius: 48
  },
  profileHeroAvatarFallback: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderColor: "#ffffff",
    borderRadius: 48,
    borderWidth: 4,
    height: 96,
    justifyContent: "center",
    width: 96
  },
  profileHeroAvatarInitial: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 30,
    lineHeight: 36
  },
  profileVerifyBadge: {
    alignItems: "center",
    backgroundColor: "#e7f5f7",
    borderColor: employeePalette.text,
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    position: "absolute",
    right: 25,
    top: 24,
    width: 50
  },
  profileVerifyBadgeImage: {
    height: 50,
    position: "absolute",
    resizeMode: "contain",
    right: 25,
    top: 24,
    width: 50
  },
  profileHeroName: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: -0.48,
    lineHeight: 34,
    paddingTop: 16,
    textAlign: "center"
  },
  profileHeroRole: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6,
    textAlign: "center"
  },
  profileRankPill: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.2)",
    borderColor: "#eec05b",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  profileRankIcon: {
    height: 16,
    resizeMode: "contain",
    width: 12
  },
  profileRankPillText: {
    color: "#755700",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18,
    textAlignVertical: "center"
  },
  profileRewardHistoryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2
  },
  profileRewardHistoryIcon: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.16)",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  profileRewardHistoryTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24
  },
  profileRewardHistorySubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    includeFontPadding: true,
    lineHeight: 18,
    marginTop: 4
  },
  profileSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: -0.48,
    lineHeight: 34,
    marginTop: 16
  },
  profileSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16
  },
  profileSeeAllButton: {
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  profileSeeAll: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  profileRankingCard: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 120,
    overflow: "hidden",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileRankingGlow: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    height: 160,
    position: "absolute",
    right: -40,
    top: -40,
    width: 160
  },
  profileRankingLabel: {
    color: "#ffdad4",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  profileRankingValueRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingTop: 4
  },
  profileRankingValue: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 40,
    includeFontPadding: true,
    letterSpacing: -1.6,
    lineHeight: 48
  },
  profileRankingSuffix: {
    color: "#ffdad4",
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6,
    paddingBottom: 2
  },
  profileRankingTrack: {
    backgroundColor: "rgba(106, 1, 0, 0.4)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
    width: "100%"
  },
  profileRankingFill: {
    backgroundColor: "#eec05b",
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  profileRankingIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    marginLeft: 20,
    width: 64
  },
  profileCertList: {
    gap: 16,
    paddingRight: 20
  },
  profileCertificateCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 160,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: 17,
    width: 260
  },
  profileCertificateCardCompact: {
    width: 180
  },
  profileCertificateBg: {
    ...StyleSheet.absoluteFillObject,
    height: "135%",
    opacity: 0.1,
    resizeMode: "cover",
    width: "100%"
  },
  profileCertificateTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  profileCertificateDate: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  profileScoreList: {
    gap: 8
  },
  profileScoreRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 74,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  profileScoreTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  profileScoreMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingTop: 8
  },
  profileScoreBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  profileScoreBadgeRed: {
    backgroundColor: "rgba(149, 1, 0, 0.1)"
  },
  profileScoreBadgeGold: {
    backgroundColor: "rgba(238, 192, 91, 0.2)"
  },
  profileScoreBadgeText: {
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  profileScoreBadgeTextRed: {
    color: employeePalette.red
  },
  profileScoreBadgeTextGold: {
    color: "#755700"
  },
  profileScoreDate: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  profileScoreDivider: {
    backgroundColor: employeePalette.border,
    height: 48,
    marginHorizontal: 16,
    width: 1
  },
  profileScoreValueRow: {
    alignItems: "flex-end",
    flexDirection: "row"
  },
  profileScoreValue: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 32,
    letterSpacing: -0.96,
    lineHeight: 38.4
  },
  profileScoreValueRed: {
    color: employeePalette.red
  },
  profileScoreMax: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 19.2,
    paddingBottom: 5
  },
  profileActionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    gap: 12,
    marginTop: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  profileLeaveButton: {
    alignItems: "center",
    borderColor: "#c08400",
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: "center"
  },
  profileLeaveButtonText: {
    color: "#c08400",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16,
    paddingTop: 1
  },
  profileTransferButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  profileReceiveTransferButton: {
    alignItems: "center",
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  profileTransferButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 24,
    paddingTop: 1
  },
  profileQrSection: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 350,
    width: "100%"
  },
  profileQrTitle: {
    marginTop: 16,
    textAlign: "center"
  },
  profileQrSegment: {
    flexDirection: "row",
    gap: 10,
    width: "100%"
  },
  profileQrSegmentActive: {
    alignItems: "center",
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    flex: 1,
    height: 42,
    justifyContent: "center"
  },
  profileQrSegmentInactive: {
    alignItems: "center",
    backgroundColor: "#a1a1aa",
    borderRadius: 12,
    flex: 1.2,
    height: 42,
    justifyContent: "center"
  },
  profileQrSegmentActiveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 22
  },
  profileQrSegmentInactiveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 22
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  profileAvatarText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 20,
    lineHeight: 24
  },
  bodyText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  listTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 24
  },
  heroTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  photoProof: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 15,
    justifyContent: "center",
    minHeight: 160,
    overflow: "hidden",
    padding: 17
  },
  photoProofTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(238, 192, 91, 0.08)",
    opacity: 0.35
  },
  photoButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#eec05b",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 25,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1
  },
  photoTitle: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24
  },
  photoHelper: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    includeFontPadding: true,
    lineHeight: 22,
    paddingTop: 12,
    textAlign: "center"
  },
  segment: {
    flexDirection: "row",
    gap: 12
  },
  segmentButton: {
    flex: 1
  },
  referralQrContent: {
    alignItems: "center",
    gap: 16
  },
  referralQrTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: true,
    letterSpacing: 0,
    lineHeight: 34,
    maxWidth: 350,
    width: "100%"
  },
  referralQrSegment: {
    flexDirection: "row",
    gap: 14,
    maxWidth: 350,
    width: "100%"
  },
  referralQrSegmentButton: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 46,
    paddingVertical: 8,
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5
  },
  referralQrSegmentButtonNarrow: {
    width: 154
  },
  referralQrSegmentButtonWide: {
    width: 182
  },
  referralQrSegmentButtonMuted: {
    backgroundColor: "#a1a1aa"
  },
  referralQrSegmentButtonGreen: {
    backgroundColor: employeePalette.green
  },
  referralQrSegmentText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    includeFontPadding: true,
    letterSpacing: 0.32,
    lineHeight: 22,
    textAlign: "center"
  },
  qrCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 350,
    paddingBottom: 24.01,
    paddingHorizontal: 24,
    paddingTop: 22.8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    width: "100%",
    elevation: 2
  },
  referralQrHelper: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 25.6,
    maxWidth: 265,
    textAlign: "center",
    width: 265
  },
  qrBox: {
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    height: 194,
    padding: 18,
    width: 194
  },
  qrCell: {
    backgroundColor: "#ffffff",
    height: 22,
    width: 22
  },
  qrCellDark: {
    backgroundColor: employeePalette.text
  },
  qrImage: {
    height: 160,
    resizeMode: "contain",
    width: 160
  },
  qrImageFrame: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 192,
    justifyContent: "center",
    marginTop: 16,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: 192,
    elevation: 1
  },
  qrShareButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 49,
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#950100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    width: "100%",
    elevation: 4
  },
  qrShareText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 16
  },
  referralCodeContainer: {
    alignItems: "center",
    backgroundColor: "#fcf8f7",
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 4,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%"
  },
  referralCodeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  referralCodeLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  referralCodeText: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 22,
    letterSpacing: 1
  },
  logoutButton: {
    borderColor: "#e3beb8",
    marginTop: 4
  },
  quizSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  quizHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  quizBackButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  quizHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28,
    marginLeft: 2
  },
  quizTimerPill: {
    alignItems: "center",
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  quizTimerText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  quizScrollContent: {
    gap: 24,
    paddingBottom: 124,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  quizProgressBlock: {
    gap: 8
  },
  quizProgressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  quizProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  quizProgressCount: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  quizProgressTrack: {
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    height: 8,
    overflow: "hidden"
  },
  quizProgressFill: {
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    height: 8,
    width: "30%"
  },
  quizQuestionCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  quizQuestionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quizQuestionBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizMapFrame: {
    backgroundColor: employeePalette.subtle,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    height: 356,
    justifyContent: "center",
    marginTop: 6,
    overflow: "hidden"
  },
  quizMapImage: {
    height: 349,
    resizeMode: "cover",
    width: 543
  },
  quizOptionsList: {
    gap: 8,
    paddingTop: 9
  },
  quizOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 66,
    padding: 17
  },
  quizOptionSelected: {
    backgroundColor: "rgba(255, 218, 214, 0.2)",
    borderColor: employeePalette.red,
    borderWidth: 2,
    padding: 16
  },
  quizRadio: {
    alignItems: "center",
    borderColor: "#8f706b",
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginRight: 20,
    width: 20
  },
  quizRadioSelected: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red
  },
  quizRadioDot: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 8,
    width: 8
  },
  quizOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizOptionTextSelected: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold
  },
  quizEssaySection: {
    gap: 8,
    paddingTop: 24
  },
  quizEssayTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  quizEssayCard: {
    backgroundColor: employeePalette.bg,
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    paddingBottom: 17,
    paddingHorizontal: 17,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  quizEssayPrompt: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  quizTextareaWrap: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 260,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  quizTextarea: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6,
    minHeight: 260,
    paddingHorizontal: 17,
    paddingTop: 16
  },
  quizTextareaIcon: {
    bottom: 16,
    position: "absolute",
    right: 16
  },
  quizBottomActions: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "#e4e4e7",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 21,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12
  },
  quizFooterButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48
  },
  quizDraftButton: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.red,
    borderWidth: 1,
    flex: 1.05,
    paddingHorizontal: 12
  },
  quizSubmitButton: {
    backgroundColor: employeePalette.red,
    flex: 1,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  quizDraftButtonText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  quizSubmitButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  resultSafe: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  resultHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  resultCloseButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  resultHeaderTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28,
    textAlign: "center"
  },
  resultHeaderSpacer: {
    width: 36
  },
  resultScrollContent: {
    paddingBottom: 72
  },
  resultHero: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    overflow: "hidden",
    paddingBottom: 49,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  resultGoldGlow: {
    backgroundColor: "#fdce67",
    borderRadius: 999,
    height: 128,
    opacity: 0.2,
    position: "absolute",
    right: -40,
    top: -40,
    width: 128
  },
  resultRedGlow: {
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    bottom: -19,
    height: 96,
    left: -20,
    opacity: 0.1,
    position: "absolute",
    width: 96
  },
  resultScoreBlock: {
    alignItems: "center",
    paddingBottom: 16
  },
  resultScoreLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    textAlign: "center"
  },
  resultScoreRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center"
  },
  resultScoreBig: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 64,
    letterSpacing: 0,
    lineHeight: 64
  },
  resultPendingTitle: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 34,
    letterSpacing: 0,
    lineHeight: 42,
    marginTop: 8,
    textAlign: "center"
  },
  resultScoreTotal: {
    color: "#8f706b",
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 28.8
  },
  resultAchievementCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(238, 192, 91, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    width: "100%",
    elevation: 1
  },
  resultMedalCircle: {
    alignItems: "center",
    backgroundColor: "rgba(238, 192, 91, 0.2)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  resultAchievementTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  resultAchievementText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 19.25,
    marginTop: 3
  },
  resultReviewSection: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 48
  },
  resultReviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  resultReviewTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 20,
    lineHeight: 30
  },
  resultCountPill: {
    backgroundColor: employeePalette.subtle,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  resultCountText: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  resultQuestionList: {
    gap: 16
  },
  resultQuestionCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 1
  },
  resultQuestionCardWrong: {
    borderColor: "#ffdad6"
  },
  resultQuestionTop: {
    flexDirection: "row",
    gap: 16,
    padding: 16
  },
  resultQuestionTopExpanded: {
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    paddingBottom: 17
  },
  resultStatusIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    marginTop: 4,
    width: 32
  },
  resultStatusCorrect: {
    backgroundColor: "#e6f4ea"
  },
  resultStatusWrong: {
    backgroundColor: "#fce8e6"
  },
  resultStatusPending: {
    backgroundColor: "rgba(238, 192, 91, 0.2)"
  },
  resultQuestionKicker: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16
  },
  resultQuestionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 25.6,
    marginBottom: 8,
    marginTop: 3
  },
  resultAnswerLine: {
    borderLeftWidth: 2,
    paddingLeft: 10
  },
  resultAnswerCorrect: {
    borderLeftColor: employeePalette.green
  },
  resultAnswerWrong: {
    borderLeftColor: "#d93025",
    marginBottom: 8
  },
  resultAnswerPending: {
    borderLeftColor: employeePalette.gold
  },
  resultAnswerText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21
  },
  resultAnswerTextWrong: {
    textDecorationLine: "line-through"
  },
  resultAnswerTextDark: {
    color: employeePalette.text
  },
  resultExplanation: {
    backgroundColor: employeePalette.bg,
    gap: 8,
    padding: 16
  },
  resultExplanationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  resultExplanationTitle: {
    color: employeePalette.goldDark,
    fontFamily: appFonts.regular,
    fontSize: 11,
    letterSpacing: 1.1,
    lineHeight: 16.5
  },
  resultExplanationText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22.75
  },
  resultExplanationImage: {
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 128,
    resizeMode: "cover",
    width: "100%"
  },
  resultDashboardButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 48,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  resultDashboardText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18,
    textAlign: "center"
  },
  inventoryAreaSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  inventoryAreaRoot: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  inventoryAreaHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#e4e4e7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 1
  },
  inventoryAreaHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  inventoryAreaIconButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  inventoryAreaTitle: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    lineHeight: 28
  },
  inventoryAreaScroll: {
    gap: 24,
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  inventoryAreaSearchRow: {
    flexDirection: "row",
    gap: 8
  },
  inventoryAreaSearchInput: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 14,
    height: 44,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  inventoryAreaSearchText: {
    color: "#6b7280",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    height: "100%",
    lineHeight: 22,
    paddingVertical: 0
  },
  inventoryAreaClearButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  inventoryAreaFilterButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    width: 44,
    elevation: 1
  },
  inventoryAreaFilterButtonActive: {
    backgroundColor: "#fff7f6",
    borderColor: employeePalette.redDark
  },
  inventoryAreaFilterBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  inventoryAreaFilterModal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%"
  },
  inventoryAreaFilterModalHeader: {
    alignItems: "center",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  inventoryAreaFilterModalTitle: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 22
  },
  inventoryAreaFilterCloseButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  inventoryAreaFilterModalList: {
    padding: 12
  },
  inventoryAreaFilterOption: {
    alignItems: "center",
    borderColor: employeePalette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  inventoryAreaFilterOptionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#f5c14b"
  },
  inventoryAreaFilterOptionText: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10
  },
  inventoryAreaFilterOptionTextActive: {
    color: employeePalette.goldDark
  },
  inventoryAreaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  inventoryAreaCard: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47.7%",
    flexGrow: 1,
    maxWidth: "47.8%",
    minHeight: 224,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2
  },
  inventoryAreaCardImageWrap: {
    backgroundColor: employeePalette.subtle,
    height: 120,
    overflow: "hidden",
    width: "100%"
  },
  inventoryAreaCardImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  inventoryAreaHotPill: {
    backgroundColor: "#6a0100",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    top: 8,
    elevation: 1
  },
  inventoryAreaHotText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  inventoryAreaCardBody: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16
  },
  inventoryAreaCardCopy: {
    gap: 4
  },
  inventoryAreaCardTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 20
  },
  inventoryAreaCardMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  inventoryAreaCardMetaText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20.8
  },
  inventoryAreaCardFooter: {
    alignItems: "center",
    borderTopColor: "#f3f4f5",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 9
  },
  inventoryAreaCardAvailable: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 20
  },
  inventoryMapSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  inventoryMapRoot: {
    backgroundColor: employeePalette.bg,
    flex: 1
  },
  inventoryMapScroll: {
    paddingBottom: 0
  },
  inventoryMapHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  inventoryMapBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  inventoryMapLegendWrap: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: employeePalette.border,
    borderBottomWidth: 1,
    height: 37
  },
  inventoryMapLegend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 25,
    height: 37,
    paddingHorizontal: 20
  },
  inventoryLegendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inventoryLegendDot: {
    borderRadius: 999,
    height: 12,
    width: 12
  },
  inventoryLegendText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 20
  },
  inventoryMapCanvas: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    height: 292,
    justifyContent: "center",
    overflow: "hidden"
  },
  inventoryMapOverview: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  inventoryMapWebView: {
    backgroundColor: "#ffffff",
    height: "100%",
    width: "100%"
  },
  inventoryMapControls: {
    elevation: 8,
    gap: 8,
    position: "absolute",
    right: 15,
    top: 54,
    zIndex: 10
  },
  inventoryMapControl: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    width: 48,
    elevation: 2
  },
  inventoryLotGrid: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 55,
    paddingHorizontal: inventoryLotGridHorizontalPadding,
    paddingTop: 25,
    rowGap: 13
  },
  inventoryLotCell: {
    alignItems: "center",
    backgroundColor: "#eec05b",
    borderRadius: 10,
    height: inventoryLotCellSize,
    justifyContent: "center",
    width: inventoryLotCellSize
  },
  inventoryLotSelected: {
    borderWidth: 0
  },
  inventoryLotHeld: {
    backgroundColor: "#1e8e3e"
  },
  inventoryLotSold: {
    backgroundColor: employeePalette.red
  },
  inventoryLotUnavailable: {
    backgroundColor: "#c8c6c5"
  },
  inventoryLotText: {
    color: "#000000",
    fontFamily: appFonts.bold,
    fontSize: 13,
    lineHeight: 16,
    maxWidth: 34,
    textAlign: "center"
  },
  inventoryLotTextLight: {
    color: "#ffffff"
  },
  inventoryMapSheet: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    marginTop: -1,
    paddingBottom: 58,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  inventorySaleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  inventorySaleBadgeText: {
    color: "#2e7d32",
    fontFamily: appFonts.regular,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 15
  },
  inventorySheetTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 38.4,
    marginTop: 10
  },
  inventoryInfoTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22
  },
  inventoryInfoTab: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
    width: "48%"
  },
  inventoryInfoTabActive: {
    backgroundColor: employeePalette.red,
    borderColor: employeePalette.red
  },
  inventoryInfoTabText: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 18
  },
  inventoryInfoTabTextActive: {
    color: "#ffffff"
  },
  inventoryInfoArticle: {
    backgroundColor: "#f8f9fa",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 18,
    padding: 16
  },
  inventoryInfoArticleEyebrow: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 16
  },
  inventoryInfoArticleTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 25
  },
  inventoryInfoArticleBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22
  },
  inventoryInfoArticleDivider: {
    backgroundColor: employeePalette.border,
    height: 1,
    marginVertical: 6,
    width: "100%"
  },
  inventoryInfoArticleAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#f0d3cf",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  inventoryInfoArticleActionText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 18
  },
  inventoryRouteButton: {
    alignItems: "center",
    backgroundColor: "#eec05b",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginTop: 22,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  inventoryPlanningButton: {
    alignItems: "center",
    backgroundColor: "#1e8e3e",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  inventoryActionText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  inventoryPlanningMap: {
    borderRadius: 10,
    height: 212,
    marginTop: 40,
    resizeMode: "cover",
    width: "100%"
  },
  inventoryComments: {
    borderTopColor: employeePalette.border,
    borderTopWidth: 1,
    gap: 16,
    marginTop: 44,
    paddingTop: 17
  },
  inventoryCommentsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  inventoryCommentsTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 14
  },
  planningCheckSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  planningCheckHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  planningCheckBackButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginLeft: -8,
    width: 36
  },
  planningCheckTitle: {
    color: "#000000",
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 26,
    marginHorizontal: 10,
    textAlign: "center"
  },
  planningCheckHeaderSpacer: {
    width: 36
  },
  planningCheckWebContainer: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  planningCheckWebView: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  inventoryCommentsCount: {
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  inventoryCommentsCountText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15
  },
  inventoryCommentsPagination: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingTop: 2
  },
  inventoryCommentsPageButton: {
    alignItems: "center",
    borderColor: "#f0d3cf",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  inventoryCommentsPageButtonActive: {
    backgroundColor: "#990100",
    borderColor: "#990100"
  },
  inventoryCommentsPageText: {
    color: "#990100",
    fontFamily: appFonts.bold,
    fontSize: 12,
    lineHeight: 18
  },
  inventoryCommentsPageTextActive: {
    color: "#ffffff"
  },
  inventoryCommentRow: {
    flexDirection: "row",
    gap: 12
  },
  inventoryCommentAvatar: {
    alignItems: "center",
    backgroundColor: employeePalette.redSoft,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  inventoryCommentAvatarGold: {
    backgroundColor: employeePalette.goldSoft
  },
  inventoryCommentInitials: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 10,
    lineHeight: 15
  },
  inventoryCommentInitialsGold: {
    color: employeePalette.goldDark
  },
  inventoryCommentMeta: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8
  },
  inventoryCommentName: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 13,
    lineHeight: 19.5
  },
  inventoryCommentTime: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 11,
    lineHeight: 16.5
  },
  inventoryCommentText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 21.13
  },
  inventoryCommentInput: {
    alignItems: "center",
    backgroundColor: "#f3f4f5",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    minHeight: 50,
    paddingLeft: 16,
    paddingRight: 16
  },
  inventoryCommentPlaceholder: {
    color: "#8f706b",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 22
  },
  inventoryCommentTextInput: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 16,
    includeFontPadding: true,
    lineHeight: 24,
    minHeight: 40,
    padding: 0,
    paddingRight: 12
  },
  inventoryCommentSendButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  lotDetailSafe: {
    backgroundColor: "#d9dadb",
    flex: 1
  },
  lotDetailScroll: {
    backgroundColor: employeePalette.bg,
    paddingBottom: 94
  },
  lotDetailHero: {
    height: 353,
    overflow: "hidden",
    width: "100%"
  },
  lotDetailHeroCarousel: {
    height: "100%",
    width: "100%"
  },
  lotDetailHeroImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  lotDetailHeroActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
    top: 0
  },
  lotDetailHeroRightActions: {
    flexDirection: "row",
    gap: 8
  },
  lotDetailHeroButton: {
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.8)",
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    width: 48,
    elevation: 1
  },
  lotDetailGalleryPill: {
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.9)",
    borderRadius: 999,
    bottom: 41,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    right: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  lotDetailGalleryText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailBody: {
    backgroundColor: employeePalette.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 24,
    marginTop: -24,
    paddingBottom: 22,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  lotDetailTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  lotDetailTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  lotDetailLocationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  lotDetailLocationText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailStatusPill: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingVertical: 9
  },
  lotDetailStatusText: {
    color: "#15803d",
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  lotDetailPriceCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  lotDetailPriceLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 14
  },
  lotDetailTotalRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12
  },
  lotDetailTotalPrice: {
    color: "#6a0100",
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -1.6,
    lineHeight: 44
  },
  lotDetailCurrency: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailDivider: {
    backgroundColor: employeePalette.border,
    height: 1,
    width: "100%"
  },
  lotDetailUnitRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12
  },
  lotDetailUnitLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  lotDetailUnitValue: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  lotDetailStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  lotDetailStatCard: {
    backgroundColor: "#ffffff",
    borderColor: employeePalette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47.5%",
    flexGrow: 1,
    gap: 4,
    minHeight: 107,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  lotDetailStatLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    includeFontPadding: false,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  lotDetailStatValue: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    includeFontPadding: false,
    letterSpacing: -0.48,
    lineHeight: 32
  },
  lotDetailDescriptionSection: {
    gap: 15,
    paddingTop: 16
  },
  lotDetailSectionTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 24,
    letterSpacing: -0.48,
    lineHeight: 28.8
  },
  lotDetailDescription: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6
  },
  lotDetailNote: {
    color: "#b50000",
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 0
  },
  lotDetailBottomActions: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopColor: "#e4e4e7",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    left: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 21,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12
  },
  lotDetailActionButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center"
  },
  lotDetailLockButton: {
    backgroundColor: "#ffffff",
    borderColor: "#1e8e3e",
    borderWidth: 1,
    flex: 1.05
  },
  lotDetailLockButtonLocked: {
    backgroundColor: "#eef8f1"
  },
  lotDetailLockButtonDisabled: {
    borderColor: "#e1e3e4",
    backgroundColor: "#f8f9fa"
  },
  lotDetailDepositButton: {
    backgroundColor: employeePalette.red,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  lotDetailDepositButtonDisabled: {
    backgroundColor: "#d4a3a0"
  },
  lotDetailLockText: {
    color: "#1e8e3e",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 24
  },
  lotDetailLockTextLocked: {
    letterSpacing: 0,
    lineHeight: 24
  },
  lotDetailLockTextDisabled: {
    color: "#a1a1aa"
  },
  lotDetailDepositText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  newsFeedSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  newsFeedHeader: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: EMPLOYEE_HEADER_HEIGHT,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  newsFeedAvatarImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  newsAvatarInitial: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 16,
    lineHeight: 20
  },
  newsFeedScroll: {
    paddingBottom: 28,
    paddingHorizontal: 20
  },
  newsFeedPageHeader: {
    gap: 3,
    paddingVertical: 24
  },
  newsFeedTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 30,
    letterSpacing: -0.96,
    lineHeight: 40
  },
  newsFeedSubtitle: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsCreateCard: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  newsCreateBody: {
    flexDirection: "row",
    gap: 16
  },
  newsCreateAvatar: {
    alignItems: "center",
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    width: 40
  },
  newsCreatePlaceholder: {
    color: "rgba(91, 64, 60, 0.5)",
    flex: 1,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 30.6
  },
  newsCreatePromptButton: {
    flex: 1
  },
  newsCreateForm: {
    gap: 10
  },
  newsCreateTitleInput: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  newsCreateContentInput: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  newsRichPreviewButton: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  richModalSafe: {
    backgroundColor: "#ffffff",
    flex: 1
  },
  richModalHeader: {
    alignItems: "center",
    borderBottomColor: "rgba(227,190,184,0.5)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  richModalClose: {
    padding: 4
  },
  richModalTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16
  },
  richModalDone: {
    padding: 4
  },
  richModalDoneText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 15
  },
  richToolbar: {
    backgroundColor: "#fdf5f4",
    borderBottomColor: "rgba(227,190,184,0.5)",
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  richEditorScroll: {
    flex: 1
  },
  richEditor: {
    flex: 1,
    minHeight: 400
  },

  newsCreateImagePreview: {
    borderRadius: 10,
    height: 150,
    overflow: "hidden",
    position: "relative"
  },
  newsCreateImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  newsCreateImageRemove: {
    alignItems: "center",
    backgroundColor: "rgba(25, 28, 29, 0.72)",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 28
  },
  newsCreateAttachmentsList: {
    gap: 8,
    marginTop: 8
  },
  newsCreateAttachmentPreview: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12
  },
  newsCreateAttachmentTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8
  },
  newsCreateAttachmentName: {
    color: employeePalette.text,
    flex: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 18
  },
  newsCreateAttachmentRemove: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  newsCreateFooter: {
    alignItems: "center",
    borderTopColor: "rgba(227, 190, 184, 0.3)",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 9
  },
  newsCreateTools: {
    flexDirection: "row",
    gap: 16,
    paddingLeft: 8
  },
  newsCreateToolButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  newsCreateButton: {
    alignItems: "center",
    backgroundColor: "#6a0100",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 24,
    shadowColor: "#6a0100",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  newsCreateButtonDisabled: {
    opacity: 0.58
  },
  newsCreateButtonText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.32,
    lineHeight: 18
  },
  newsCreateCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 8
  },
  newsCreateCancelText: {
    color: employeePalette.muted,
    fontFamily: appFonts.semiBold,
    fontSize: 14,
    lineHeight: 18
  },
  newsFeedList: {
    gap: 24,
    paddingTop: 48
  },
  newsPostCard: {
    backgroundColor: employeePalette.bg,
    borderColor: "#e3beb8",
    borderRadius: 12,
    borderWidth: 1,
    gap: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  newsPostHighlighted: {
    borderColor: "#eec05b",
    borderWidth: 2,
    gap: 15,
    overflow: "hidden",
    padding: 26
  },
  newsPostHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 4
  },
  newsPostAuthorRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 16
  },
  newsPostAvatarGold: {
    alignItems: "center",
    backgroundColor: employeePalette.border,
    borderColor: "#e3beb8",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48
  },
  newsPostAvatar: {
    alignItems: "center",
    backgroundColor: employeePalette.border,
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48
  },
  newsPostAuthor: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 18,
    lineHeight: 28.8
  },
  newsPostMeta: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 18
  },
  newsStarPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 223, 159, 0.3)",
    borderColor: "rgba(238, 192, 91, 0.5)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 5
  },
  newsPostMenuWrap: {
    alignItems: "flex-end",
    minWidth: 36,
    position: "relative",
    zIndex: 6
  },
  newsPostMenuButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 36
  },
  newsPostMenu: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(227, 190, 184, 0.75)",
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    minWidth: 190,
    padding: 6,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    top: 36,
    zIndex: 20,
    elevation: 8
  },
  newsPostMenuItem: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 10
  },
  newsPostMenuItemText: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsPostMenuItemDanger: {
    color: employeePalette.red
  },
  newsEditPostButton: {
    alignItems: "center",
    borderColor: "rgba(149, 1, 0, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 11
  },
  newsEditPostText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsPostTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    lineHeight: 30.6
  },
  newsPostBodyWrap: {
    position: "relative"
  },
  newsPostBody: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsPostBodyMeasure: {
    left: 0,
    opacity: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: -1
  },
  newsReadMoreButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    marginTop: 6,
    paddingRight: 8,
    paddingVertical: 4
  },
  newsReadMore: {
    color: employeePalette.red,
    fontFamily: appFonts.bold
  },
  newsStandardBody: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 16,
    lineHeight: 25.6
  },
  newsPostImage: {
    backgroundColor: "#d9dadb",
    borderColor: "rgba(227, 190, 184, 0.3)",
    borderRadius: 8,
    borderWidth: 1,
    height: 224,
    resizeMode: "cover",
    width: "100%"
  },
  newsPostAttachmentList: {
    gap: 8,
    paddingTop: 2
  },
  newsPostAttachmentChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff7f6",
    borderColor: "rgba(149, 1, 0, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minHeight: 38,
    paddingHorizontal: 10
  },
  newsPostAttachmentText: {
    color: employeePalette.text,
    flexShrink: 1,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 17
  },
  newsEditForm: {
    gap: 10
  },
  newsEditActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  newsEditImageButton: {
    alignItems: "center",
    borderColor: "rgba(149, 1, 0, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12
  },
  newsEditImageText: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsEditActionButtons: {
    flexDirection: "row",
    gap: 8
  },
  newsEditCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 10
  },
  newsEditCancelText: {
    color: employeePalette.muted,
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsEditSaveButton: {
    alignItems: "center",
    backgroundColor: employeePalette.red,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 16
  },
  newsEditSaveText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 16
  },
  newsPostActions: {
    alignItems: "center",
    borderTopColor: "rgba(227, 190, 184, 0.5)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    paddingTop: 10
  },
  newsPostAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  newsPostActionShare: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  newsPostActionText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 22.4
  },
  newsGoldAccent: {
    backgroundColor: "rgba(238, 192, 91, 0.1)",
    height: 64,
    position: "absolute",
    right: 0,
    top: 0,
    width: 64
  },
  question: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    lineHeight: 28
  },
  option: {
    borderColor: employeePalette.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14
  },
  optionActive: {
    backgroundColor: "#fff7df",
    borderColor: "#eec05b"
  },
  optionText: {
    color: employeePalette.text,
    fontFamily: appFonts.regular,
    fontSize: 15,
    lineHeight: 22
  },
  resultCard: {
    alignItems: "center"
  },
  resultScore: {
    color: employeePalette.red,
    fontFamily: appFonts.bold,
    fontSize: 64,
    letterSpacing: -1.6,
    lineHeight: 72
  },
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  lotCell: {
    alignItems: "center",
    backgroundColor: "#dff7e9",
    borderColor: "rgba(30, 142, 62, 0.25)",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: "17.5%"
  },
  lotReserved: {
    backgroundColor: "#fff7df",
    borderColor: "#ffd987"
  },
  lotSold: {
    backgroundColor: "#f2f2f2",
    borderColor: employeePalette.border
  },
  lotText: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    lineHeight: 16
  },
  legend: {
    flexDirection: "row",
    gap: 8
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  backButton: {
    padding: 8
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: appFonts.bold,
    color: employeePalette.redDark
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: "#f7e8e5"
  },
  tabText: {
    fontSize: 14,
    fontFamily: appFonts.semiBold,
    color: "#6b7280"
  },
  tabTextActive: {
    color: employeePalette.redDark,
    fontFamily: appFonts.bold
  },
  recruitmentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  recruitmentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  recruitmentName: {
    fontSize: 18,
    fontFamily: appFonts.bold,
    color: "#1f2937",
    marginBottom: 2
  },
  recruitmentPhone: {
    fontSize: 14,
    fontFamily: appFonts.regular,
    color: "#6b7280"
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusText: {
    fontSize: 12,
    fontFamily: appFonts.bold
  },
  recruitmentInfoRow: {
    flexDirection: "row",
    marginBottom: 6
  },
  recruitmentInfoLabel: {
    width: 90,
    fontSize: 14,
    fontFamily: appFonts.semiBold,
    color: "#6b7280"
  },
  recruitmentInfoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#374151"
  },
  recruitmentDetails: {
    marginTop: 8,
    paddingTop: 8
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 8
  },
  detailField: {
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: appFonts.semiBold,
    color: "#9ca3af",
    marginBottom: 2
  },
  detailValue: {
    fontSize: 14,
    fontFamily: appFonts.regular,
    color: "#1f2937"
  },
  cvButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f7e8e5",
    borderWidth: 1,
    borderColor: "#edc8c2",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4
  },
  cvButtonText: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#6a0100"
  },
  recruitmentCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6"
  },
  toggleExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  toggleExpandText: {
    fontSize: 14,
    fontFamily: appFonts.semiBold,
    color: "#6b7280"
  },
  actionButtonContainer: {
    flexDirection: "row",
    gap: 8
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  rejectBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db"
  },
  approveBtn: {
    backgroundColor: employeePalette.redDark
  },
  actionBtnTextReject: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#4b5563"
  },
  actionBtnTextApprove: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#ffffff"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: appFonts.bold,
    color: "#1f2937",
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: appFonts.regular,
    color: "#4b5563",
    marginBottom: 12
  },
  modalInput: {
    height: 100,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    color: "#1f2937",
    fontFamily: appFonts.regular,
    fontSize: 14,
    marginBottom: 16
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  modalCancelBtn: {
    backgroundColor: "#f3f4f6"
  },
  modalConfirmBtn: {
    backgroundColor: "#c62828"
  },
  modalBtnTextCancel: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#4b5563"
  },
  modalBtnTextConfirm: {
    fontSize: 14,
    fontFamily: appFonts.bold,
    color: "#ffffff"
  },
  phoneNoteContainer: {
    backgroundColor: "#FDF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCD2D2",
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: 350,
    width: "100%",
  },
  phoneNoteText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: appFonts.regular,
    flex: 1,
  },
  phoneHighlight: {
    color: employeePalette.red,
    fontFamily: appFonts.semiBold,
  },
  pressed: {
    opacity: 0.84
  },
  mandatoryCourseList: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 16
  },
  mandatoryEmptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12
  },
  mandatoryEmptyTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center"
  },
  mandatoryEmptyDesc: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  mandatoryContinueBtn: {
    backgroundColor: employeePalette.green,
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 14
  },
  mandatoryContinueBtnText: {
    color: "#ffffff",
    fontFamily: appFonts.semiBold,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  mandatoryCourseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e1e3e4",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  mandatoryCourseThumbWrap: {
    height: 120,
    position: "relative",
    backgroundColor: "#2a2f36"
  },
  mandatoryCourseThumb: {
    height: "100%",
    width: "100%",
    objectFit: "cover"
  },
  mandatoryCourseThumbPlaceholder: {
    alignItems: "center",
    backgroundColor: employeePalette.goldDark,
    flex: 1,
    justifyContent: "center"
  },
  mandatoryBadge: {
    backgroundColor: "#dc3545",
    borderRadius: 6,
    bottom: 8,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: "absolute"
  },
  mandatoryBadgeText: {
    color: "#ffffff",
    fontFamily: appFonts.bold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1
  },
  mandatoryCourseBody: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  mandatoryCourseTitle: {
    color: employeePalette.text,
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  mandatoryCourseDesc: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 19
  },
  mandatoryCourseMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingTop: 2
  },
  mandatoryCourseMetaText: {
    color: employeePalette.muted,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  mandatoryProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4
  },
  mandatoryProgressLabel: {
    color: employeePalette.muted,
    fontFamily: appFonts.bold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1
  },
  mandatoryProgressPercent: {
    color: employeePalette.text,
    fontFamily: appFonts.bold,
    fontSize: 12,
    fontWeight: "800"
  }
});
