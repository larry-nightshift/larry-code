import { X, LayoutDashboard, Focus, FileText, CheckSquare, UtensilsCrossed, ShoppingCart, Flame, Wrench, BookOpen, Users } from 'lucide-react';

type Feature = 'dashboard' | 'focus' | 'notes' | 'tasks' | 'recipes' | 'grocery' | 'habits' | 'maintenance' | 'posts' | 'crm';

interface SidebarProps {
  currentFeature: Feature;
  onFeatureChange: (feature: Feature) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: Array<{ id: Feature; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'focus', label: 'Focus', icon: <Focus size={20} /> },
  { id: 'notes', label: 'Notes', icon: <FileText size={20} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { id: 'recipes', label: 'Recipes', icon: <UtensilsCrossed size={20} /> },
  { id: 'grocery', label: 'Grocery Lists', icon: <ShoppingCart size={20} /> },
  { id: 'habits', label: 'Habits', icon: <Flame size={20} /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={20} /> },
  { id: 'posts', label: 'Posts', icon: <BookOpen size={20} /> },
  { id: 'crm', label: 'CRM', icon: <Users size={20} /> },
];

export function Sidebar({ currentFeature, onFeatureChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-primary transform transition-transform duration-300 ease-in-out lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-white font-semibold text-lg">Larry</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-base lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onFeatureChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-base ${
                  currentFeature === item.id
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-white/10">
            <p className="text-small text-white/50">Personal Dashboard</p>
          </div>
        </div>
      </aside>
    </>
  );
}
