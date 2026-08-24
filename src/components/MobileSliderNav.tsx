import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Tag,
  User,
  Menu,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  PlusCircle,
  ShoppingCart,
  CalendarPlus,

  LogOutIcon,
} from "lucide-react";
import { useAuth } from "../context/UserContext";

type Section = "dashboard" | "products" | "services" | "promotion" | "profile";

const SidebarNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Section | null>(null);
  const { logout } = useAuth();  // <<--- USING AUTH CONTEXT
  const navigate = useNavigate();
  const location = useLocation();

  // close sidebar on route change
  useEffect(() => setIsOpen(false), [location.pathname]);

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

  const handleSectionClick = (item: { id: string; path?: string }) => {
    if (subNavigation[item.id as Section]?.length > 0) {
      setExpanded(expanded === item.id ? null : (item.id as Section));
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Top Bar - Always Show Menu Btn */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 z-40">
       <Link to="/">
          <img src="/navlogo.png" alt="Logo" className="h-8" />
        </Link>
       
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-black text-white rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Same behavior mobile + desktop) */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-black text-white shadow-xl z-50 
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center py-6 border-b border-gray-700">
          <img src="/navlogo.png" alt="Logo" className="h-12 mb-2" />
          <p className="text-sm text-gray-300">Vendor Panel</p>
        </div>

        {/* Navigation */}
        <div className="p-6 space-y-3 overflow-y-auto h-[calc(100%-120px)]">
          {mainNavigationItems.map((item) => {
            const Icon = item.icon;
            const hasSub = subNavigation[item.id as Section]?.length > 0;
            const isOpenMenu = expanded === item.id;

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleSectionClick(item)}
                  className={`flex w-full items-center justify-between px-4 py-3 rounded-lg transition
                  ${location.pathname.includes(item.id)
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {hasSub && (isOpenMenu ? <ChevronUp /> : <ChevronDown />)}
                </button>

                {hasSub && isOpenMenu && (
                  <div className="ml-6 mt-2 space-y-2">
                    {subNavigation[item.id as Section].map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.path}
                          onClick={() => navigate(sub.path)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg 
                          ${location.pathname === sub.path
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:bg-gray-800"
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <button
  onClick={() => {
    logout()
  }}
  className="mt-6 w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-600 transition rounded-lg font-medium"
>
  <LogOutIcon className="w-5 h-5" />
  Logout
</button>
        </div>
        
      </div>
    </>
  );
};

export default SidebarNav;
