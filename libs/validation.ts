// Vietnamese phone: 0xxxxxxxxx or +84xxxxxxxxx
export function isValidVietnamesePhone(phone: string): boolean {
  return /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone.replace(/\s/g, ""));
}

// Email format
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// OTP: exactly 6 digits
export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}

// Date format Y-m-d
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
export function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

// Date is not in the past (for leave request)
export function isDateNotPast(date: string): boolean {
  if (!isValidDateFormat(date)) {
    return false;
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return date >= todayStr;
}
