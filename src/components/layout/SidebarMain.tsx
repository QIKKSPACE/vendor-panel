export default function SidebarMain({ mainSection, navigate, items }) {
  return (
    <div className="hidden lg:flex w-16 bg-black flex-col items-center py-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-12 h-12 flex items-center justify-center rounded-lg mb-2 transition-all ${
              mainSection === item.id
                ? "bg-gray-800 text-white"
                : "text-gray-200 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <Icon className="w-6 h-6" />
          </button>
        );
      })}
    </div>
  );
}
