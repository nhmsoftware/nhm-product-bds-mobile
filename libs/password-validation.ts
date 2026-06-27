const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX_NUMBER = /[0-9]/;
const PASSWORD_REGEX_SPECIAL = /[@$!%*#?&]/;

export type PasswordValidationError =
  | "too_short"
  | "missing_number"
  | "missing_special"
  | null;

export function validatePasswordStrength(password: string): PasswordValidationError {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "too_short";
  }
  if (!PASSWORD_REGEX_NUMBER.test(password)) {
    return "missing_number";
  }
  if (!PASSWORD_REGEX_SPECIAL.test(password)) {
    return "missing_special";
  }
  return null;
}

export function getPasswordErrorMessage(error: PasswordValidationError): string {
  switch (error) {
    case "too_short":
      return "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ký tự đặc biệt và số.";
    case "missing_number":
      return "Mật khẩu phải chứa ít nhất một chữ số.";
    case "missing_special":
      return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt (@, $, !, %, *, #, ? hoặc &).";
    case null:
      return "";
  }
}
