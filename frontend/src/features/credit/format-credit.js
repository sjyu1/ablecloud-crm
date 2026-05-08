export function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue)) {
    return "-";
  }

  return numberValue.toLocaleString("ko-KR");
}
