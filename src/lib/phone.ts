/** Strip to at most 10 US national digits (drops a leading country code 1). */
export function usPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length > 10) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function formatUsPhoneLocal(digits: string): string {
  const d = usPhoneDigits(digits);
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function formatUsPhoneFull(digits: string): string {
  const d = usPhoneDigits(digits);
  if (d.length !== 10) return "";
  return `+1 ${formatUsPhoneLocal(d)}`;
}

export function isValidUsPhone(value: string): boolean {
  return usPhoneDigits(value).length === 10;
}
