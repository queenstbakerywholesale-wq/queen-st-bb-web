import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "./AdminLogin";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Cake,
  Users,
  Store,
  MessageSquare,
  ImageIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const ADMIN_BASE = "/admin-angela91";

// Block search engine indexing for all admin pages
function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = "noindex, nofollow";
    return () => {
      if (prev) meta.content = prev;
      else meta.remove();
    };
  }, []);
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: ShoppingCart, label: "Orders", path: "/orders" },
  { icon: Truck, label: "Shipping", path: "/shipping" },
  { icon: Cake, label: "Bookings", path: "/bookings" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Store, label: "Branches", path: "/branches" },
  { icon: MessageSquare, label: "Enquiries", path: "/enquiries" },
  { icon: ImageIcon, label: "Page Images", path: "/page-images" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useNoIndex();
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F0EB" }}
      >
        <div
          className="text-sm tracking-[0.15em] uppercase animate-pulse"
          style={{
            fontFamily: "var(--font-body, 'Jost', sans-serif)",
            color: "#5A3A2E80",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const currentPath = location.replace(ADMIN_BASE, "") || "";

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#FAFAF7" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: collapsed ? 72 : 240,
          backgroundColor: "#5A3A2E",
          color: "#F5F0EB",
        }}
      >
        {/* Header */}
        <div
          className="h-16 flex items-center justify-between px-4 border-b"
          style={{ borderColor: "rgba(245,240,235,0.1)" }}
        >
          {!collapsed && (
            <span
              className="text-xs font-light tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-body, 'Jost', sans-serif)" }}
            >
              QSB Admin
            </span>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors lg:block hidden"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const fullPath = `${ADMIN_BASE}${item.path}`;
            const isActive =
              item.path === ""
                ? currentPath === "" || currentPath === "/"
                : currentPath.startsWith(item.path);

            return (
              <Link key={item.path} href={fullPath}>
                <div
                  className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                    isActive ? "bg-white/15" : "hover:bg-white/8"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? "opacity-100" : "opacity-60"
                    }`}
                  />
                  {!collapsed && (
                    <span
                      className={`text-[13px] ${
                        isActive ? "font-medium" : "font-light"
                      }`}
                      style={{
                        fontFamily: "var(--font-body, 'Jost', sans-serif)",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "rgba(245,240,235,0.1)" }}
        >
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-white/8 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] opacity-60" />
            {!collapsed && (
              <span
                className="text-[13px] font-light"
                style={{
                  fontFamily: "var(--font-body, 'Jost', sans-serif)",
                  letterSpacing: "0.03em",
                }}
              >
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header
          className="h-14 flex items-center px-4 border-b lg:hidden"
          style={{ borderColor: "#5A3A2E15", backgroundColor: "#FAFAF7" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md hover:bg-black/5 transition-colors"
          >
            <Menu className="w-5 h-5" style={{ color: "#5A3A2E" }} />
          </button>
          <span
            className="ml-3 text-xs font-light tracking-[0.15em] uppercase"
            style={{
              fontFamily: "var(--font-body, 'Jost', sans-serif)",
              color: "#5A3A2E",
            }}
          >
            QSB Admin
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
