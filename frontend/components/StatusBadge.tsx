import clsx from "clsx";

const COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ISSUED: "bg-blue-100 text-blue-800",
  INVOICED: "bg-purple-100 text-purple-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-500",
  VALIDATED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  UNDER_REVIEW: "bg-orange-100 text-orange-800",
  APPROVED: "bg-green-100 text-green-800",
  NEEDS_CLARIFICATION: "bg-orange-100 text-orange-800",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", COLORS[status] ?? "bg-gray-100 text-gray-600")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
