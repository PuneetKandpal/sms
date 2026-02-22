import { formatLocalDateLabel as formatDateLabel } from "../../../../utils/dateUtils";

export default function formatLocalDateLabel(
  value,
  { includeTime = true } = {}
) {
  return formatDateLabel(value, { includeTime });
}
