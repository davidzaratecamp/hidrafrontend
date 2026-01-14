import { useState, useEffect } from 'react';
import { Plus, UserMinus, AlertTriangle, Users, Mail, Calendar, Shield } from 'lucide-react';
import SidebarSeleccion from './SidebarSeleccion';

const GestionUsuarios = () => {
  const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'http://200.91.204.54'

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol: 'reclutador'
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/seleccion/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error cargando usuarios');
      }

      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      setError('Error cargando usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/seleccion/usuarios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando usuario');
      }

      setSuccess('Usuario creado exitosamente');
      setFormData({ nombre_completo: '', email: '', password: '', rol: 'reclutador' });
      setShowCreateForm(false);
      await cargarUsuarios();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error creando usuario: ' + error.message);
    }
  };

  const handleDeleteUsuario = async (usuarioId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/seleccion/usuarios/${usuarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error eliminando usuario');
      }

      setSuccess('Usuario eliminado exitosamente');
      setShowDeleteConfirm(null);
      await cargarUsuarios();

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error eliminando usuario: ' + error.message);
      setShowDeleteConfirm(null);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const usuariosActivos = usuarios.filter(u => u.activo);
  const reclutadoresActivos = usuarios.filter(u => u.activo && u.rol === 'reclutador');
  const seleccionActivos = usuarios.filter(u => u.activo && u.rol === 'seleccion');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <SidebarSeleccion />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-gray-600">Administra los usuarios reclutadores y de selección</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Alertas */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                  <p className="text-2xl font-semibold text-gray-900">{usuariosActivos.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Reclutadores</p>
                  <p className="text-2xl font-semibold text-gray-900">{reclutadoresActivos.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Selección</p>
                  <p className="text-2xl font-semibold text-gray-900">{seleccionActivos.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Lista de Usuarios</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acceso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              usuario.rol === 'seleccion' ? 'bg-purple-100' : 'bg-green-100'
                            }`}>
                              <span className={`font-medium ${
                                usuario.rol === 'seleccion' ? 'text-purple-600' : 'text-green-600'
                              }`}>
                                {usuario.nombre_completo.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.nombre_completo}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {usuario.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          usuario.rol === 'seleccion'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {usuario.rol === 'seleccion' ? 'Selección' : 'Reclutador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          usuario.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatearFecha(usuario.ultimo_acceso)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {usuario.activo && (
                          <button
                            onClick={() => setShowDeleteConfirm(usuario)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <UserMinus className="h-4 w-4" />
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usuarios.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo usuario.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Crear Usuario */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input
                      type="text"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      required
                      minLength={6}
                    />
                    <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({...formData, rol: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="reclutador">Reclutador</option>
                      <option value="seleccion">Selección</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setFormData({ nombre_completo: '', email: '', password: '', rol: 'reclutador' });
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
                    >
                      Crear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">Confirmar Eliminación</h3>
                <p className="text-sm text-gray-500 mt-2">
                  ¿Estás seguro de que quieres eliminar a <strong>{showDeleteConfirm.nombre_completo}</strong>?
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Rol: {showDeleteConfirm.rol === 'seleccion' ? 'Selección' : 'Reclutador'}
                </p>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteUsuario(showDeleteConfirm.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionUsuarios;
