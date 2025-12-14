import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Calculator, User, MessageSquare, ShoppingBag, Shield, Handshake } from 'lucide-react'

export default function EvaluacionEntrevista({ candidato, onClose, onGuardarEvaluacion }) {
  const [evaluacion, setEvaluacion] = useState({
    saludo: '',
    perfilamiento: '',
    producto: '',
    objeciones: '',
    cierre: ''
  })
  const [razonRechazo, setRazonRechazo] = useState('')
  const [total, setTotal] = useState(0)
  const [aprobado, setAprobado] = useState(null)

  // Calcular total automáticamente cuando cambian las evaluaciones
  useEffect(() => {
    const valores = Object.values(evaluacion).map(val => parseFloat(val) || 0)
    const nuevoTotal = valores.reduce((sum, val) => sum + val, 0)
    setTotal(nuevoTotal)
    setAprobado(nuevoTotal >= 71)
  }, [evaluacion])

  const handleChange = (campo, valor) => {
    // Validar que no exceda 20
    if (valor === '' || (parseFloat(valor) >= 0 && parseFloat(valor) <= 20)) {
      setEvaluacion(prev => ({
        ...prev,
        [campo]: valor
      }))
    }
  }

  const handleGuardar = () => {
    // Validar que todos los campos estén llenos
    const todosCompletos = Object.values(evaluacion).every(val => val !== '' && parseFloat(val) >= 0)
    
    if (!todosCompletos) {
      alert('Por favor complete todas las evaluaciones (0-20 puntos cada una)')
      return
    }

    if (!aprobado && !razonRechazo.trim()) {
      alert('Por favor ingrese la razón del rechazo')
      return
    }

    onGuardarEvaluacion({
      candidatoId: candidato.id,
      saludo: parseFloat(evaluacion.saludo),
      perfilamiento: parseFloat(evaluacion.perfilamiento),
      producto: parseFloat(evaluacion.producto),
      objeciones: parseFloat(evaluacion.objeciones),
      cierre: parseFloat(evaluacion.cierre),
      total,
      aprobado,
      razonRechazo: aprobado ? null : razonRechazo
    })
  }

  const criterios = [
    { key: 'saludo', label: 'Saludo', icon: User, color: 'blue' },
    { key: 'perfilamiento', label: 'Perfilamiento', icon: MessageSquare, color: 'green' },
    { key: 'producto', label: 'Producto', icon: ShoppingBag, color: 'purple' },
    { key: 'objeciones', label: 'Manejo de Objeciones', icon: Shield, color: 'orange' },
    { key: 'cierre', label: 'Cierre de Venta', icon: Handshake, color: 'red' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-medium text-gray-900 mb-4 flex items-center">
            <Calculator className="h-6 w-6 mr-2 text-blue-600" />
            Evaluación de Entrevista - {candidato.primer_nombre} {candidato.primer_apellido}
          </h3>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Evalúe cada criterio del 0 al 20. Se requiere un mínimo de 71% para aprobar la entrevista.
            </p>
            
            <div className="grid gap-4">
              {criterios.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-2 text-${color}-600`} />
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={evaluacion[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0-20"
                      />
                      <span className="text-sm text-gray-500">/ 20</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-${color}-500 transition-all duration-300`}
                      style={{ width: `${(parseFloat(evaluacion[key]) || 0) * 5}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resultado Total */}
          <div className={`border-2 rounded-lg p-4 mb-6 ${aprobado ? 'border-green-200 bg-green-50' : total > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {aprobado ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                ) : total > 0 ? (
                  <XCircle className="h-6 w-6 text-red-600 mr-2" />
                ) : (
                  <Calculator className="h-6 w-6 text-gray-400 mr-2" />
                )}
                <div>
                  <p className="text-lg font-semibold">
                    Total: {total.toFixed(1)}%
                  </p>
                  <p className={`text-sm ${aprobado ? 'text-green-600' : total > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {total === 0 ? 'Complete la evaluación' : aprobado ? 'APROBADO ✓' : 'NO APROBADO ✗'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Mínimo requerido</p>
                <p className="text-sm font-medium text-gray-700">71%</p>
              </div>
            </div>
          </div>

          {/* Razón de Rechazo */}
          {!aprobado && total > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del Rechazo *
              </label>
              <textarea
                value={razonRechazo}
                onChange={(e) => setRazonRechazo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Explique las razones por las cuales el candidato no aprobó la entrevista..."
                required
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={handleGuardar}
              disabled={Object.values(evaluacion).some(val => val === '')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Guardar Evaluación
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}