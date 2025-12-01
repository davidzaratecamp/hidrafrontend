import { Users, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Gestión de Reclutadores',
      href: '/hydra/admin/reclutadores',
      icon: Users
    }
  ];

  return (
    <div className="h-full flex flex-col bg-indigo-900 text-white">
      {/* Logo/Header */}
      <div className="flex items-center h-16 px-6 bg-indigo-800">
        <Settings className="h-8 w-8 text-indigo-200" />
        <span className="ml-2 text-xl font-semibold">Admin Panel</span>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-indigo-800">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.nombre_completo?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.nombre_completo}</p>
            <p className="text-xs text-indigo-200">{user?.rol}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-100 hover:bg-indigo-700'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-700 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;