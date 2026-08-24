const getApiBaseUrl = () => {
  return import.meta.env.DEV ? 'http://localhost:3000/api' : 'http://200.91.204.54:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }
  
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GET Error:', error);
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('POST Error:', error);
      throw error;
    }
  }

  async put(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PUT Error:', error);
      throw error;
    }
  }

  async validarToken(token) {
    return this.get(`/candidato/token/${token}`);
  }

  async getCandidatosPorEstado(estado, page = 1, search = '') {
    const params = new URLSearchParams({ page });
    if (search) params.set('search', search);
    return this.get(`/candidato/por-estado/${estado}?${params.toString()}`);
  }

  async getResumenEstados() {
    return this.get('/candidato/resumen-estados');
  }

  async reenviarEmail(candidatoId) {
    return this.post(`/candidato/reenviar-email/${candidatoId}`);
  }

  async crearCandidato(data) {
    return this.post('/candidato/crear', data);
  }

  async editarCandidato(candidatoId, data) {
    return this.put(`/candidato/editar/${candidatoId}`, data);
  }

  async cambiarEstadoCandidato(candidatoId, estado) {
    return this.put(`/candidato/cambiar-estado/${candidatoId}`, { estado });
  }

  async actualizarFechaEntrevista(candidatoId, fecha) {
    return this.put(`/candidato/fecha-entrevista/${candidatoId}`, { fecha_citacion_entrevista: fecha });
  }

  async marcarNoCitado(candidatoId, motivo) {
    return this.put(`/candidato/no-citado/${candidatoId}`, { motivo });
  }

  async getReclutadoresActivos() {
    return this.get('/candidato/reclutadores-activos');
  }

  async reasignarCandidato(candidatoId, nuevoReclutadorId) {
    return this.put(`/candidato/reasignar/${candidatoId}`, { nuevo_reclutador_id: nuevoReclutadorId });
  }

  async getCatalogos() {
    return this.get('/candidato/catalogos');
  }

  async actualizarHojaVida(token, data) {
    return this.put(`/candidato/hoja-vida/${token}`, data);
  }

  async actualizarDatosBasicos(token, data) {
    return this.put(`/candidato/datos-basicos/${token}`, data);
  }

  async actualizarEstudios(token, data) {
    return this.put(`/candidato/estudios/${token}`, data);
  }

  async actualizarExperiencia(token, data) {
    return this.put(`/candidato/experiencia/${token}`, data);
  }

  async actualizarPersonal(token, data) {
    return this.put(`/candidato/personal/${token}`, data);
  }

  async actualizarConsentimiento(token, data) {
    return this.put(`/candidato/consentimiento/${token}`, data);
  }

  async getPerfilCompleto(candidatoId) {
    return this.get(`/candidato/perfil/${candidatoId}`);
  }

  // Estado de firma en FirmaCloud (hoja de vida + tratamiento de datos) — Hydra no guarda copia
  // de los documentos, esto consulta en vivo cada vez.
  async getEstadoFirma(candidatoId) {
    return this.get(`/candidato/firma-estado/${candidatoId}`);
  }

  // Descarga (proxy) uno de los 2 documentos firmados. `tipo` = 'cv' | 'tratamiento'. Mismo
  // patrón que getPdfDesprendible: devuelve el blob directo, no pasa por this.get (que espera
  // JSON).
  async getDocumentoFirmadoBlob(candidatoId, tipo) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/candidato/firma-documento/${candidatoId}/${tipo}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${response.status}`);
    }
    return response.blob();
  }

  // Guarda el estado y/o el documento de una o varias de las 4 verificaciones de antecedentes
  // (ADRES/POL/COMP/PROCU) - multipart, no pasa por this.put (que siempre manda JSON). No se fija
  // Content-Type a mano: el navegador arma el boundary del multipart automáticamente. Cada
  // verificación se auto-guarda independiente (ver PerfilCandidato.jsx), así que formData suele
  // traer solo los campos de UNA verificación por llamada.
  async actualizarAntecedentes(candidatoId, formData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/candidato/antecedentes/${candidatoId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${response.status}`);
    }
    return response.json();
  }

  // Descarga (proxy) el documento de antecedentes de una verificación puntual (tipo =
  // 'adres'|'pol'|'comp'|'procu') - mismo patrón blob que getDocumentoFirmadoBlob.
  async getDocumentoAntecedentesBlob(candidatoId, tipo) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/candidato/antecedentes/${candidatoId}/documento/${tipo}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${response.status}`);
    }
    return response.blob();
  }

  // Analytics
  async getEstadosEnTiempo() {
    return this.get('/candidato/analytics/estados-tiempo');
  }

  async getEstadisticasClientes() {
    return this.get('/candidato/analytics/clientes');
  }

  async getEstadisticasCargos() {
    return this.get('/candidato/analytics/cargos');
  }

  async getProgresoFormularios() {
    return this.get('/candidato/analytics/progreso');
  }

  // Admin Methods
  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('DELETE Error:', error);
      throw error;
    }
  }

  async getMesesDesprendibles() {
    return this.get('/desprendibles/meses');
  }

  async getPdfDesprendible(year, month) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/desprendibles/pdf/${year}/${month}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      const data = await response.json();
      throw new Error(data.message ?? `Error: ${response.status}`);
    }
    return response.blob();
  }

  async getReclutadores() {
    return this.get('/auth/admin/reclutadores');
  }

  async crearReclutador(data) {
    return this.post('/auth/admin/reclutadores', data);
  }

  async eliminarReclutador(reclutadorId) {
    return this.delete(`/auth/admin/reclutadores/${reclutadorId}`);
  }

  async reasignarCandidatos(reclutadorOrigenId, reclutadorDestinoId) {
    return this.post('/auth/admin/reasignar-candidatos', {
      reclutadorOrigenId,
      reclutadorDestinoId
    });
  }
}

export default new ApiService();