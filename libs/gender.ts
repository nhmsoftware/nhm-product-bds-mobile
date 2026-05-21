export const USER_GENDER = {
  unspecified: 0,
  male: 1,
  female: 2
} as const;

export type UserGenderValue = (typeof USER_GENDER)[keyof typeof USER_GENDER];

export const USER_GENDER_OPTIONS = [
  {
    icon: "male-outline",
    label: "NAM",
    value: USER_GENDER.male
  },
  {
    icon: "female-outline",
    label: "NỮ",
    value: USER_GENDER.female
  }
] as const;

export function normalizeGenderValue(value?: number | null) {
  return value === USER_GENDER.female ? USER_GENDER.female : USER_GENDER.male;
}
