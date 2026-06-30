import { useI18n } from "@/libs/i18n";

export const vi = {
  tabs: {
    learningTitle: "Học tập & Phát triển",
    learningSubtitle: "Hoàn thành bài học, bài thi và chứng chỉ cần thiết.",
    newsTitle: "Bảng tin nội bộ",
    newsSubtitle: "Tin tức, thông báo và thảo luận trong đội ngũ.",
    profileTitle: "Hồ sơ",
    profileSubtitle: "Quản lý thông tin cá nhân, điểm và yêu cầu nội bộ.",
    managerTitle: "Hồ sơ trưởng phòng",
    managerSubtitle: "Theo dõi đội nhóm, phê duyệt yêu cầu và hiệu suất phòng ban.",
    requiredTitle: "Lộ trình học bắt buộc",
    requiredSubtitle: "Các khóa cần hoàn thành trước khi nhận giỏ hàng mới."
  },
  meetClient: {
    title: "Gặp khách",
    headerTitle: "Check-in Gặp Khách",
    customerInfo: "Thông tin khách hàng",
    customer: "Nhập tên khách hàng",
    phone: "09xx xxx xxx",
    project: "Chọn khu đất...",
    projects: ["Vinhomes Grand Park", "Masteri Centre Point", "The Beverly"],
    photoTitle: "Hình ảnh thực tế",
    photoCta: "Chụp ảnh thực tế",
    photoHelper: "Yêu cầu ảnh chụp cùng khách tại khu đất",
    recent: "Hoạt động gần đây",
    seeAll: "Xem tất cả"
  },
  showing: {
    title: "Dẫn khách",
    headerTitle: "Check-in Dẫn Khách",
    project: "The Grand Hanoi, Trần Duy Hưng",
    unit: "A10, Tòa S2.01",
    customer: "Nguyễn Văn A",
    tripInfo: "Thông tin lượt dẫn",
    proof: "Chụp ảnh tại khu đất",
    helper: "Hình ảnh cần hiển thị rõ vị trí hoặc khách hàng",
    action: "Bắt đầu Dẫn khách",
    history: "Lịch sử dẫn khách"
  },
  pointHistory: {
    title: "Lịch sử điểm",
    subtitle: "Theo dõi điểm tích lũy từ hoạt động và học tập.",
    total: "8,450",
    rank: "Hạng Vàng",
    month: "Tháng này",
    activity: "Hoạt động gần đây"
  },
  personalInfo: {
    title: "Thông tin cá nhân",
    subtitle: "Thông tin hồ sơ nhân viên và cấu hình liên hệ.",
    department: "Kinh doanh khu đất",
    code: "KNL-2024-001",
    role: "Chuyên viên tư vấn cấp cao",
    save: "Cập nhật hồ sơ"
  },
  qr: {
    title: "Mã QR Giới thiệu",
    subtitle: "Sử dụng mã này để giới thiệu khách hàng tham gia hệ thống.",
    recruitmentSubtitle: "Sử dụng mã này để giới thiệu ứng viên ứng tuyển vào hệ thống.",
    customerSubtitle: "Sử dụng mã này để giới thiệu khách hàng tham gia hệ thống.",
    employee: "MÃ TUYỂN DỤNG",
    customer: "MÃ GT KHÁCH HÀNG",
    share: "Chia sẻ mã"
  },
  requests: {
    leaveTitle: "Danh sách Xin nghỉ phép",
    transferTitle: "Danh sách xin chuyển phòng ban",
    staffTitle: "Danh sách nhân viên phòng ban",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    approve: "Duyệt",
    reject: "Từ chối"
  },
  learning: {
    detailTitle: "Chi tiết Bài học",
    quizTitle: "Làm bài thi",
    resultTitle: "Kết quả học tập",
    certTitle: "Chứng Chỉ Của Tôi",
    start: "Bắt đầu học",
    submit: "Nộp bài",
    retake: "Làm lại",
    score: "Điểm số"
  },
  inventory: {
    listTitle: "Danh sách kho hàng",
    mapTitle: "Sơ đồ Bảng Hàng",
    detailTitle: "Chi tiết Lô Đất",
    available: "Còn hàng",
    reserved: "Đang giữ chỗ",
    sold: "Đã bán",
    consult: "Tư vấn khách",
    hold: "Giữ chỗ"
  },
  notifications: {
    title: "Thông báo",
    subtitle: "Cập nhật mới từ hệ thống và quản lý.",
    comments: "Bình luận & Thảo luận",
    send: "Gửi"
  }
};

const en: typeof vi = {
  tabs: {
    learningTitle: "Learning & Development",
    learningSubtitle: "Complete required lessons, quizzes, and certificates.",
    newsTitle: "Internal News",
    newsSubtitle: "Team updates, announcements, and discussion.",
    profileTitle: "Profile",
    profileSubtitle: "Manage personal info, points, and internal requests.",
    managerTitle: "Manager Profile",
    managerSubtitle: "Track team members, approvals, and department performance.",
    requiredTitle: "Required Learning Path",
    requiredSubtitle: "Courses to finish before receiving new inventory."
  },
  meetClient: {
    title: "Client meeting",
    headerTitle: "Client Meeting Check-in",
    customerInfo: "Customer information",
    customer: "Enter customer name",
    phone: "09xx xxx xxx",
    project: "Choose project...",
    projects: ["Vinhomes Grand Park", "Masteri Centre Point", "The Beverly"],
    photoTitle: "Real photo",
    photoCta: "Take real photo",
    photoHelper: "Photo must include the customer at project site",
    recent: "Recent activity",
    seeAll: "See all"
  },
  showing: {
    title: "Property tour",
    headerTitle: "Property Tour Check-in",
    project: "The Grand Hanoi, Tran Duy Hung",
    unit: "A10, Tower S2.01",
    customer: "Nguyen Van A",
    tripInfo: "Tour information",
    proof: "Take project photo",
    helper: "Photo should show location or customer clearly",
    action: "Start property tour",
    history: "Tour history"
  },
  pointHistory: {
    title: "Point history",
    subtitle: "Track points from activity and learning.",
    total: "8,450",
    rank: "Gold Tier",
    month: "This month",
    activity: "Recent activity"
  },
  personalInfo: {
    title: "Personal info",
    subtitle: "Employee profile and contact settings.",
    department: "Project sales",
    code: "KNL-2024-001",
    role: "Senior consultant",
    save: "Update profile"
  },
  qr: {
    title: "Referral QR",
    subtitle: "Use this code to refer new clients to the system.",
    recruitmentSubtitle: "Use this code to refer candidates to the system.",
    customerSubtitle: "Use this code to refer new clients to the system.",
    employee: "HIRING CODE",
    customer: "CLIENT REFERRAL",
    share: "Share code"
  },
  requests: {
    leaveTitle: "Leave requests",
    transferTitle: "Transfer requests",
    staffTitle: "Department staff",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    approve: "Approve",
    reject: "Reject"
  },
  learning: {
    detailTitle: "Lesson detail",
    quizTitle: "Quiz",
    resultTitle: "Learning result",
    certTitle: "My Certificates",
    start: "Start lesson",
    submit: "Submit",
    retake: "Retake",
    score: "Score"
  },
  inventory: {
    listTitle: "Inventory",
    mapTitle: "Inventory Map",
    detailTitle: "Lot Detail",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    consult: "Consult client",
    hold: "Reserve"
  },
  notifications: {
    title: "Notifications",
    subtitle: "System and manager updates.",
    comments: "Comments & Discussion",
    send: "Send"
  }
};


export function useCopy() {
  const { language } = useI18n();
  return language === "en" ? en : vi;
}
