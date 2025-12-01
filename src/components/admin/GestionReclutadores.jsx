import { useState, useEffect } from 'react';
import { Plus, UserMinus, AlertTriangle, Users, Mail, Calendar } from 'lucide-react';
import ApiService from '../../services/api';
import AdminSidebar from './AdminSidebar';

const GestionReclutadores = () => {
  const [reclutadores, setReclutadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showReasignDialog, setShowReasignDialog] = useState(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: ''
  });

  const [reasignData, setReasignData] = useState({
    reclutadorDestinoId: ''
  });

  useEffect(() => {
    cargarReclutadores();
  }, []);

  const cargarReclutadores = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getReclutadores();
      setReclutadores(data);
    } catch (error) {
      setError('Error cargando reclutadores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await ApiService.crearReclutador(formData);
      setSuccess('Reclutador creado exitosamente');
      setFormData({ nombre_completo: '', email: '', password: '' });
      setShowCreateForm(false);
      await cargarReclutadores();
    } catch (error) {
      setError('Error creando reclutador: ' + error.message);
    }
  };

  const handleDeleteReclutador = async (reclutadorId) => {
    try {
      setError('');
      await ApiService.eliminarReclutador(reclutadorId);
      setSuccess('Reclutador eliminado exitosamente');
      setShowDeleteConfirm(null);
      await cargarReclutadores();
    } catch (error) {
      if (error.message.includes('candidatos asignados')) {
        const reclutador = reclutadores.find(r => r.id === reclutadorId);
        setShowReasignDialog(reclutador);
        setShowDeleteConfirm(null);
      } else {
        setError('Error eliminando reclutador: ' + error.message);
        setShowDeleteConfirm(null);
      }
    }
  };

  const handleReasignarCandidatos = async () => {
    try {
      setError('');
      await ApiService.reasignarCandidatos(
        showReasignDialog.id,
        parseInt(reasignData.reclutadorDestinoId)
      );
      
      // Ahora eliminar el reclutador original
      await ApiService.eliminarReclutador(showReasignDialog.id);
      
      setSuccess('Candidatos reasignados y reclutador eliminado exitosamente');
      setShowReasignDialog(null);
      setReasignData({ reclutadorDestinoId: '' });
      await cargarReclutadores();
    } catch (error) {
      setError('Error en la reasignación: ' + error.message);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const reclutadoresActivos = reclutadores.filter(r => r.activo);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando reclutadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Reclutadores</h1>
              <p className="text-gray-600">Administra los usuarios reclutadores del sistema</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nuevo Reclutador
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
                <p className="text-sm font-medium text-gray-500">Total Reclutadores</p>
                <p className="text-2xl font-semibold text-gray-900">{reclutadores.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{reclutadoresActivos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Candidatos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reclutadores.reduce((sum, r) => sum + r.candidatos_asignados, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Reclutadores */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Lista de Reclutadores</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reclutador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidatos Asignados
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
                {reclutadores.map((reclutador) => (
                  <tr key={reclutador.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {reclutador.nombre_completo.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {reclutador.nombre_completo}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {reclutador.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reclutador.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {reclutador.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reclutador.candidatos_asignados} candidatos
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatearFecha(reclutador.ultimo_acceso)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {reclutador.activo && (
                        <button
                          onClick={() => setShowDeleteConfirm(reclutador)}
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
          </div>
        </div>
      </div>

      {/* Modal Crear Reclutador */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">Crear Nuevo Reclutador</h3>
              <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ nombre_completo: '', email: '', password: '' });
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
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
              {showDeleteConfirm.candidatos_asignados > 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  Este reclutador tiene {showDeleteConfirm.candidatos_asignados} candidatos asignados.
                </p>
              )}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteReclutador(showDeleteConfirm.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reasignar Candidatos */}
      {showReasignDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <AlertTriangle className="mx-auto h-12 w-12 text-orange-600" />
              <h3 className="text-lg font-medium text-gray-900 text-center mt-4">Reasignar Candidatos</h3>
              <p className="text-sm text-gray-500 mt-2 text-center">
                <strong>{showReasignDialog.nombre_completo}</strong> tiene {showReasignDialog.candidatos_asignados} candidatos asignados.
                <br />Debes reasignarlos antes de eliminar el reclutador.
              </p>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Reasignar a:</label>
                <select
                  value={reasignData.reclutadorDestinoId}
                  onChange={(e) => setReasignData({...reasignData, reclutadorDestinoId: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Seleccionar reclutador...</option>
                  {reclutadoresActivos
                    .filter(r => r.id !== showReasignDialog.id)
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nombre_completo} ({r.candidatos_asignados} candidatos)
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowReasignDialog(null);
                    setReasignData({ reclutadorDestinoId: '' });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReasignarCandidatos}
                  disabled={!reasignData.reclutadorDestinoId}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded disabled:opacity-50"
                >
                  Reasignar y Eliminar
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

export default GestionReclutadores;