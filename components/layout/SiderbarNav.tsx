"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { NAV_GROUPS } from "@/config/nav";

const STORAGE_KEY = "sidebar.openGroups.v1";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav() {
  const pathname = usePathname();

  // grupos que deberían estar abiertos por la ruta actual
  const routeOpenKeys = useMemo(() => {
    const keys = NAV_GROUPS.filter((g) => pathname.startsWith(g.base)).map(
      (g) => g.key
    );
    // si no coincide ninguno, abrimos finanzas por defecto
    return keys.length ? keys : ["finanzas"];
  }, [pathname]);

  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(routeOpenKeys));

  // Cargar estado desde localStorage (multi-open persistente)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setOpenKeys(new Set(parsed.map(String)));
      }
    } catch {
      // noop
    }
  }, []);

  // Si navegás a una ruta dentro de un grupo cerrado, lo abre automáticamente
  useEffect(() => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      routeOpenKeys.forEach((k) => next.add(k));
      return next;
    });
  }, [routeOpenKeys]);

  // Persistir
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(openKeys)));
    } catch {
      // noop
    }
  }, [openKeys]);

  const toggleGroup = (key: string, nextOpen: boolean) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (nextOpen) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <nav className="space-y-2">
      {NAV_GROUPS.map((group) => {
        const open = openKeys.has(group.key);

        return (
          <Collapsible
            key={group.key}
            open={open}
            onOpenChange={(v) => toggleGroup(group.key, v)}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium">{group.title}</span>
                <span className="text-xs opacity-70">{open ? "▲" : "▼"}</span>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pl-3 space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "block rounded-md px-3 py-2 text-sm",
                      active ? "bg-muted font-semibold" : "hover:bg-muted/60",
                    ].join(" ")}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
