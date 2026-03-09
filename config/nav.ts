export type NavItem = {
  title: string;
  href: string;
};

export type NavGroup = {
  key: string;   // único, sirve para estado
  title: string;
  base: string;  // para auto-highlight por ruta
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "finanzas",
    title: "Finanzas",
    base: "/dashboard/finanzas",
    items: [
      { title: "Resumen", href: "/dashboard/finanzas" },
      { title: "Ventas", href: "/dashboard/finanzas/ventas" },
      { title: "Pagos", href: "/dashboard/finanzas/pagos" },
      { title: "Productos", href: "/dashboard/finanzas/productos" },
      { title: "Pareto 80/20", href: "/dashboard/finanzas/pareto" },
    ],
  },
  {
    key: "operativo",
    title: "Operativo",
    base: "/dashboard/operativo",
    items: [
      { title: "Resumen", href: "/dashboard/operativo" },
      { title: "Conversaciones", href: "/dashboard/operativo/conversaciones" },
      { title: "SLA", href: "/dashboard/operativo/sla" },
    ],
  },
  {
    key: "marketing",
    title: "Marketing",
    base: "/dashboard/marketing",
    items: [
      { title: "Meta Ads", href: "/dashboard/marketing/meta-ads" },
    ],
  },
];
