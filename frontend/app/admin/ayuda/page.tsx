"use client";
import AppShell from "@/components/AppShell";
import { useState } from "react";

type RoleTag = "Admin" | "Concierge" | "Front Desk" | "Auditor";

const ROLE_COLORS: Record<RoleTag, string> = {
  Admin:       "bg-[#002147] text-white",
  Concierge:   "bg-blue-100 text-blue-800",
  "Front Desk":"bg-purple-100 text-purple-800",
  Auditor:     "bg-amber-100 text-amber-800",
};

function RoleBadge({ role }: { role: RoleTag }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
      {role}
    </span>
  );
}

interface Module {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  roles: RoleTag[];
  description: string;
  steps: string[];
  tip?: string;
}

const MODULES: Module[] = [
  {
    id: "vouchers",
    icon: "🎟️",
    title: "Vouchers",
    subtitle: "Crear y gestionar vouchers de servicio",
    roles: ["Admin", "Concierge"],
    description:
      "El voucher es el documento central del sistema. Cada vez que un huésped contrata un servicio externo (tour, transporte, spa), se crea un voucher que autoriza al proveedor a ejecutar el servicio y documenta el costo y precio al huésped.",
    steps: [
      "Haga clic en + Nuevo Voucher.",
      "Seleccione el servicio del catálogo. Puede buscar por nombre o código.",
      "Elija el canal de venta (Directo, OTA, Agencia…). El precio al huésped se completa solo desde el tarifario.",
      "Ingrese el proveedor y el costo que el proveedor le cobra al hotel.",
      "Complete los datos del huésped: nombre, habitación y propiedad.",
      "Indique la fecha del servicio y la cantidad de PAX.",
      "Guarde. Se genera el consecutivo (VCH-2026-XXXXXX) automáticamente.",
      "Haga clic en PDF para descargar el voucher — esto también lo marca como Enviado.",
      "El proveedor recibe el PDF con un código QR. Al escanearlo confirma la recepción.",
    ],
    tip: "El margen (precio huésped − costo proveedor) se calcula automáticamente y es visible en el detalle del voucher.",
  },
  {
    id: "estados",
    icon: "🔄",
    title: "Estados del Voucher",
    subtitle: "Ciclo de vida de un voucher",
    roles: ["Admin", "Concierge", "Front Desk", "Auditor"],
    description:
      "Cada voucher pasa por estados que indican en qué punto del proceso se encuentra.",
    steps: [
      "Creado — El voucher existe pero aún no se ha enviado al proveedor.",
      "Enviado — Se descargó el PDF y el proveedor fue notificado.",
      "Facturado — Front Desk registró el uso del servicio en el sistema (se ingresó el número de factura del proveedor).",
      "Pagado — El proveedor fue pagado (registrado en Cuentas por Pagar).",
      "Cancelado — El servicio no se realizó o fue anulado.",
    ],
    tip: "El estado Confirmado (badge verde) es independiente: indica que el proveedor escaneó el QR del voucher. Un voucher puede estar Enviado y ya Confirmado por el proveedor al mismo tiempo.",
  },
  {
    id: "proveedores",
    icon: "🏢",
    title: "Proveedores",
    subtitle: "Directorio de empresas externas",
    roles: ["Admin"],
    description:
      "Aquí se registran todas las empresas o personas que prestan servicios a los huéspedes: operadoras de tours, transportistas, instructores de buceo, etc.",
    steps: [
      "Haga clic en + Nuevo Proveedor.",
      "Ingrese el nombre, tipo (Tour, Transporte u Otro), email y teléfono de contacto.",
      "Opcionalmente registre la cuenta bancaria para pagos.",
      "El proveedor quedará activo y disponible al crear vouchers.",
      "Para desactivar un proveedor sin eliminarlo, use el botón Activo/Inactivo en la tabla.",
    ],
    tip: "Un proveedor inactivo no aparece en el formulario de vouchers, pero sus vouchers históricos se conservan.",
  },
  {
    id: "servicios",
    icon: "📋",
    title: "Catálogo de Servicios",
    subtitle: "Experiencias y actividades disponibles",
    roles: ["Admin"],
    description:
      "El catálogo define qué servicios puede ofrecer el hotel. Cada servicio tiene un código único (ej. TT-0018) que facilita su identificación en vouchers y reportes.",
    steps: [
      "Haga clic en + Nuevo Servicio.",
      "Asigne un código de tarifa (ej. SP-0006) y categoría (Tours, Spa, Transfers, Others).",
      "Ingrese el nombre descriptivo del servicio.",
      "Guarde. El servicio ya estará disponible al crear vouchers.",
    ],
    tip: "Los códigos de tarifa aparecen entre corchetes en la tabla de vouchers para identificación rápida.",
  },
  {
    id: "precios",
    icon: "💲",
    title: "Precios",
    subtitle: "Tarifario por canal de venta",
    roles: ["Admin"],
    description:
      "Cada servicio puede tener precios diferentes según el canal por el que se vendió: Directo Compartido, Directo Exclusivo, OTA, Agencia u otros. El tarifario controla qué precio se muestra automáticamente al crear un voucher.",
    steps: [
      "Seleccione el servicio en la lista.",
      "Agregue o edite los precios por canal.",
      "Al crear un voucher y elegir el canal, el precio al huésped se rellena solo.",
    ],
    tip: "Si un servicio no tiene precio configurado para un canal, el concierge puede ingresar el precio manualmente.",
  },
  {
    id: "front-desk",
    icon: "🏨",
    title: "Front Desk",
    subtitle: "Registro de uso al momento del check-out",
    roles: ["Front Desk"],
    description:
      "Cuando el huésped hace check-out, Front Desk busca el voucher, verifica que el servicio se realizó e ingresa el número de factura del proveedor. Esto genera el registro de uso que pasa a auditoría.",
    steps: [
      "Ingrese el número de voucher (ej. VCH-2026-000008) en el buscador.",
      "El sistema muestra los datos del voucher y el servicio.",
      "Ingrese el número de factura que entregó el proveedor.",
      "Confirme el monto de la factura (debe coincidir con el costo del voucher ±5%).",
      "Haga clic en Registrar Uso. El voucher pasa a estado Facturado.",
      "El panel inferior muestra todos los usos registrados hoy.",
    ],
    tip: "Si el monto de la factura difiere más del 5% del costo del voucher, el sistema lo marca como anomalía en los reportes.",
  },
  {
    id: "auditoria-interna",
    icon: "🔍",
    title: "Auditoría Interna",
    subtitle: "Revisión y aprobación de vouchers por administración",
    roles: ["Admin"],
    description:
      "Vista exclusiva del administrador para revisar todos los vouchers, comparar la información con facturas físicas y aprobar o poner en disputa los cargos antes de pago.",
    steps: [
      "Filtre por propiedad, rango de fechas o estado de auditoría.",
      "Haga clic en un consecutivo para abrir el panel de revisión.",
      "Verifique que los datos coincidan con la factura física del proveedor.",
      "Marque como Aprobado (todo correcto) o En Disputa (hay discrepancia).",
      "Ingrese el número de factura y notas si es necesario.",
      "Los vouchers aprobados pasan al módulo de Cuentas por Pagar.",
    ],
    tip: "El badge de confirmación del proveedor (verde ✓) le indica que el proveedor ya reconoció el voucher desde su lado.",
  },
  {
    id: "cuentas-pagar",
    icon: "💳",
    title: "Cuentas por Pagar",
    subtitle: "Control de pagos pendientes a proveedores",
    roles: ["Admin"],
    description:
      "Muestra los vouchers aprobados que aún no han sido pagados al proveedor. Permite registrar el pago y llevar el historial de lo que se ha pagado a cada empresa.",
    steps: [
      "La tabla muestra todos los vouchers con estado Aprobado pendientes de pago.",
      "Seleccione los vouchers que va a pagar en este lote.",
      "Registre el pago: fecha, número de transferencia y banco.",
      "Los vouchers pagados cambian a estado Pagado y salen de la lista pendiente.",
    ],
  },
  {
    id: "provisiones",
    icon: "📊",
    title: "Provisiones",
    subtitle: "Resumen financiero por proveedor",
    roles: ["Admin"],
    description:
      "Vista que consolida cuánto se le debe a cada proveedor en el período seleccionado, basado en los vouchers emitidos. Útil para proyectar el flujo de caja y preparar los pagos del mes.",
    steps: [
      "Seleccione el rango de fechas o mes.",
      "El sistema agrupa los montos pendientes por proveedor.",
      "Use esta vista para comparar contra las facturas recibidas al cierre del mes.",
    ],
  },
  {
    id: "auditoria-externa",
    icon: "✅",
    title: "Auditoría (Validación)",
    subtitle: "Validación independiente de usos registrados",
    roles: ["Auditor"],
    description:
      "Módulo para auditores independientes que verifican que los usos de vouchers registrados por Front Desk sean correctos. Pueden aprobar, rechazar o marcar para revisión.",
    steps: [
      "La pestaña Pendientes muestra los usos de vouchers que esperan validación.",
      "Haga clic en un registro para ver todos los detalles.",
      "Seleccione Aprobado, Rechazado o En Revisión.",
      "Ingrese hallazgos o notas de evidencia si aplica.",
      "El historial completo de validaciones está en la pestaña Reporte.",
    ],
  },
  {
    id: "reportes",
    icon: "📈",
    title: "Reportes",
    subtitle: "Análisis de ingresos, anomalías y trazabilidad",
    roles: ["Admin"],
    description:
      "Panel de análisis con gráficas y tablas para tomar decisiones. Incluye ingresos validados por proveedor y propiedad, detección de anomalías de precio, y trazabilidad completa de cualquier voucher.",
    steps: [
      "Ingresos Validados — total facturado y aprobado por proveedor.",
      "Por Proveedor — ranking de proveedores por volumen de ventas.",
      "Por Propiedad — distribución de vouchers entre Corcovado, Ojochal, Amarena y Oxigen.",
      "Anomalías — vouchers donde el monto de la factura difiere más del 5% del costo acordado.",
      "Trazabilidad — ingrese el ID de un voucher y vea su historia completa: creación → uso → auditoría.",
    ],
    tip: "Las anomalías son el primer indicador de posibles cobros incorrectos por parte de proveedores.",
  },
  {
    id: "confirmacion-proveedor",
    icon: "📱",
    title: "Confirmación del Proveedor (QR)",
    subtitle: "Página pública de recepción del voucher",
    roles: ["Admin", "Concierge"],
    description:
      "Cada PDF incluye un código QR que lleva al proveedor a una página web pública (sin login). Al llegar a esa página, el proveedor presiona un botón para confirmar que recibió el voucher y está listo para ejecutar el servicio.",
    steps: [
      "El concierge entrega el PDF al proveedor (impreso o por WhatsApp).",
      "El proveedor escanea el QR con su celular.",
      "Ve los datos del servicio: guest, fecha, PAX, propiedad.",
      "Presiona ✓ Confirmar recepción del voucher.",
      "En el sistema aparece el badge verde Confirmado con fecha y hora.",
      "El PDF también muestra el stamp RECEPCIÓN CONFIRMADA POR PROVEEDOR al regenerarse.",
    ],
    tip: "Si el proveedor ya confirmó, el botón de confirmación desaparece y muestra la fecha/hora del registro.",
  },
];

const FLOW_STEPS = [
  { label: "Concierge crea voucher",  role: "Concierge", color: "bg-blue-100 border-blue-300 text-blue-900" },
  { label: "Descarga PDF y lo envía al proveedor", role: "Concierge", color: "bg-blue-100 border-blue-300 text-blue-900" },
  { label: "Proveedor confirma por QR", role: "Proveedor", color: "bg-green-100 border-green-300 text-green-900" },
  { label: "Front Desk registra factura al check-out", role: "Front Desk", color: "bg-purple-100 border-purple-300 text-purple-900" },
  { label: "Admin revisa y aprueba", role: "Admin", color: "bg-[#e8edf4] border-[#002147] text-[#002147]" },
  { label: "Pago al proveedor registrado", role: "Admin", color: "bg-[#e8edf4] border-[#002147] text-[#002147]" },
];

export default function AyudaPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <AppShell roles={["admin", "concierge", "auditor"]}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Centro de Ayuda</h1>
          <p className="text-gray-500 text-sm mt-1">
            Guía completa del Sistema de Vouchers — The Costa Rica Collection
          </p>
        </div>

        {/* Flujo general */}
        <div className="card mb-8">
          <h2 className="font-bold text-base mb-4">¿Cómo funciona el sistema?</h2>
          <p className="text-sm text-gray-500 mb-5">
            Un voucher nace cuando un huésped contrata un servicio externo y muere cuando el proveedor
            ha sido pagado. Este es el flujo completo:
          </p>
          <div className="flex flex-col gap-2">
            {FLOW_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${step.color}`}>
                <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 text-sm font-medium">{step.label}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-60">{step.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Módulos */}
        <h2 className="font-bold text-base mb-4">Módulos del sistema</h2>
        <div className="space-y-3">
          {MODULES.map(mod => (
            <div key={mod.id} className="card p-0 overflow-hidden">

              {/* Header del módulo */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(open === mod.id ? null : mod.id)}
              >
                <span className="text-2xl">{mod.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{mod.title}</div>
                  <div className="text-xs text-gray-400 truncate">{mod.subtitle}</div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {mod.roles.map(r => <RoleBadge key={r} role={r} />)}
                </div>
                <span className="text-gray-400 text-sm ml-2">{open === mod.id ? "▲" : "▼"}</span>
              </button>

              {/* Contenido expandible */}
              {open === mod.id && (
                <div className="border-t px-5 py-5 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">{mod.description}</p>

                  <div className="mb-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Paso a paso</div>
                    <ol className="space-y-2">
                      {mod.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 items-start text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-[#002147] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {mod.tip && (
                    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
                      <span className="text-amber-500">💡</span>
                      <p className="text-xs text-amber-800 leading-relaxed">{mod.tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 mb-4 text-center text-xs text-gray-400">
          Sistema de Vouchers Electrónicos · The Costa Rica Collection · v1.0
        </div>
      </div>
    </AppShell>
  );
}
