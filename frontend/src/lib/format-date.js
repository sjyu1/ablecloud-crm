export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  return (
    <>
      {year}-{month}-{day}
    </>
  );
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const normalizedValue = String(value).replace("T", " ").replace(/\.\d+Z?$/, "");
  const [datePart = "-", timePart = "00:00:00"] = normalizedValue.split(" ");

  return `${datePart} ${timePart.slice(0, 8)}`;
}
