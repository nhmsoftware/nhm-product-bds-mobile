import type {
  EmployeeAction,
  EmployeeCheckEvent,
  EmployeeKpi,
  EmployeeLesson,
  EmployeeNewsPost
} from "@/services/employee/types";

export const employeeKpis: EmployeeKpi[] = [
  {
    label: "Tin tức nội bộ mới",
    value: "124",
    helper: "Xem ngay",
    tone: "red",
    icon: "newspaper-outline"
  },
  {
    label: "Điểm tích lũy",
    value: "8,450",
    helper: "Hạng Vàng (Gold Tier)",
    tone: "gold",
    icon: "star"
  }
];

export const employeeHomeActions: EmployeeAction[] = [
  {
    title: "Thông báo mới",
    description: "Cập nhật chính sách hoa hồng quý 3 và lộ trình ra mắt",
    icon: "calendar-outline"
  },
  {
    title: "Kho hàng",
    description: "Danh sách kho hàng tại Khởi Nguyên",
    icon: "business-outline"
  },
  {
    title: "Khóa học",
    description: "2 khóa học mới cần hoàn thành tuần này",
    icon: "school-outline"
  }
];

export const employeeNewsPosts: EmployeeNewsPost[] = [
  {
    id: "post-1",
    author: "Ban quản lý",
    role: "Điều hành dự án",
    timeAgo: "2 giờ trước",
    category: "Thông báo chung",
    title: "Kinh Doanh Dự Án Cao Cấp",
    content:
      "Cập nhật chính sách hoa hồng quý 3 và danh sách sản phẩm ưu tiên cho nhóm tư vấn.",
    pinned: true,
    comments: 12,
    likes: 48
  },
  {
    id: "post-2",
    author: "Phòng đào tạo",
    role: "Learning team",
    timeAgo: "Hôm nay",
    category: "Học tập",
    title: "Bắt buộc hoàn thành lộ trình pháp lý",
    content:
      "Nhân viên kinh doanh cần hoàn tất 3 bài học pháp lý trước khi nhận giỏ hàng mới.",
    comments: 5,
    likes: 21
  },
  {
    id: "post-3",
    author: "Kho hàng",
    role: "Inventory control",
    timeAgo: "Hôm qua",
    category: "Nguồn hàng",
    title: "Cập nhật trạng thái lô đất khu A",
    content:
      "Một số lô đã được giữ chỗ, kiểm tra lại sơ đồ bảng hàng trước khi tư vấn khách.",
    comments: 8,
    likes: 34
  }
];

export const employeeLessons: EmployeeLesson[] = [
  {
    id: "lesson-1",
    title: "Môi Giới Bất Động Sản Cao Cấp",
    provider: "Hiệp hội Bất động sản Việt Nam",
    status: "verified",
    issuedAt: "12/03/2026",
    expiresAt: "12/03/2028",
    score: "95%"
  },
  {
    id: "lesson-2",
    title: "Quản Trị Vận Hành Căn Hộ",
    provider: "Viện Đào tạo Quốc tế CRE",
    status: "verified",
    issuedAt: "18/02/2026",
    expiresAt: "18/02/2028",
    score: "82%"
  },
  {
    id: "lesson-3",
    title: "Marketing BĐS Kỹ Thuật Số",
    provider: "Google Digital Academy",
    status: "inProgress",
    issuedAt: "Đang học",
    expiresAt: "Còn 5 ngày",
    score: "64%"
  },
  {
    id: "lesson-4",
    title: "Kỹ Năng Đàm Phán Triệu Đô",
    provider: "Harvard Business Review Certification",
    status: "required",
    issuedAt: "Bắt buộc",
    expiresAt: "Còn 2 ngày"
  }
];

export const employeeCheckEvents: EmployeeCheckEvent[] = [
  {
    id: "check-1",
    type: "checkIn",
    title: "Check-in văn phòng",
    location: "Tòa nhà Khởi Nguyên, tầng 8",
    time: "08:42 AM",
    status: "done"
  },
  {
    id: "check-2",
    type: "clientVisit",
    title: "Gặp khách hàng",
    location: "Khu đô thị Đông Anh",
    time: "10:30 AM",
    status: "pending"
  },
  {
    id: "check-3",
    type: "checkOut",
    title: "Check-out cuối ngày",
    location: "Chưa thực hiện",
    time: "18:00 PM",
    status: "pending"
  }
];
