import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Tag,
  User,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  PlusCircle,
  ClipboardList,
  CalendarPlus,

  LogOutIcon,
} from "lucide-react";
import { useAuth } from "../context/UserContext";

type Section =
  | "dashboard"
  | "products"
  | "services"
  | "profile";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
const { logout } = useAuth();  // <<--- USING AUTH CONTEXT}
  const [openSection, setOpenSection] = useState<Section | null>(null);

  const mainNavigationItems = [
    { id: "products", label: "Products", icon: Package },
    { id: "services", label: "Services", icon: Wrench },
  
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  const subNavigation: Record<Section, Array<{ label: string; path: string; icon: any }>> = {
    dashboard: [],
    profile: [],
    products: [
      { label: "All Products", path: "/products/all", icon: ClipboardList },
      { label: "Add Product", path: "/products/add", icon: PlusCircle },
      { label: "Product Orders", path: "/products/orders", icon: ShoppingCart },
    ],
    services: [
    
      { label: "Add Service", path: "/services/add", icon: PlusCircle },
      { label: "Service Orders", path: "/services/orders", icon: ShoppingCart },
      { label: "Add Slots", path: "/services/slots", icon: CalendarPlus },
    ],
  };

  const toggleSection = (id: Section, hasChildren: boolean, path?: string) => {
    if (!hasChildren) {
      navigate(path!);
      return;
    }
    setOpenSection(prev => (prev === id ? null : id));
  };

  return (
    <aside className="hidden lg:block w-64 bg-black text-white h-screen py-5 select-none">
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold tracking-wide">Vendor Panel</h2>
      </div>

      <nav className="space-y-1">
        {mainNavigationItems.map(({ id, label, icon: Icon, path }) => {
          const hasChildren = subNavigation[id as Section].length > 0;
          const isExpanded = openSection === id;

          return (
            <div key={id}>
              {/* MAIN BUTTON */}
              <button
                onClick={() => toggleSection(id as Section, hasChildren, path)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm 
                  hover:bg-gray-800 transition-all rounded-lg
                  ${location.pathname.includes(id) ? "bg-gray-900 font-medium" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {label}
                </span>

                {hasChildren && (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                )}
              </button>

              {/* SUBMENU */}
              {isExpanded && hasChildren && (
                <div className="ml-11 mt-1 space-y-1 border-l border-gray-700 pl-3">
                  {subNavigation[id as Section].map(({ label, path, icon: SubIcon }) => (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className={`w-full flex items-center gap-2 text-left px-2 py-2 text-xs rounded-md hover:bg-gray-800 transition-all
                        ${location.pathname === path ? "bg-gray-900 text-white" : "text-gray-300"}`}
                    >
                      <SubIcon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* LOGOUT */}
        <button
  onClick={() => {
 logout()
  }}
  className="mt-6 w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-600 transition rounded-lg font-medium"
>
  <LogOutIcon className="w-5 h-5" />
  Logout
</button>
      </nav>
    </aside>
  );
}
