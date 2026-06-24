import clsx from "clsx";

const LABELS: Record<string, string> = {
  PENDING:               "Creado",
  ISSUED:                "Enviado",
  INVOICED:              "Facturado",
  PAID:                  "Pagado",
  CANCELLED:             "Cancelado",
  VALIDATED:             "Validado",
  REJECTED:              "Rechazado",
  UNDER_REVIEW:          "En revisión",
  APPROVED:              "Aprobado",
  NEEDS_CLARIFICATION:   "Pendiente aclaración",
};

const COLORS: Record<string, string> = {
  PENDING:               "bg-gray-100 text-gray-600",
  ISSUED:                "bg-blue-100 text-blue-700",
  INVOICED:              "bg-purple-100 text-purple-700",
  PAID:                  "bg-green-100 text-green-700",
  CANCELLED:             "bg-red-100 text-red-600",
  VALIDATED:             "bg-green-100 text-green-700",
  REJECTED:              "bg-red-100 text-red-700",
  UNDER_REVIEW:          "bg-orange-100 text-orange-700",
  APPROVED:              "bg-green-100 text-green-700",
  NEEDS_CLARIFICATION:   "bg-orange-100 text-orange-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", COLORS[status] ?? "bg-gray-100 text-gray-600")}>
      {LABELS[status] ?? status}
    </span>
  );
}
