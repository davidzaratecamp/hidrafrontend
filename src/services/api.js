const API_BASE_URL = 'http://200.91.204.54/api';

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
        throw new Error(`Error: ${response.status}`);
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
        throw new Error(`Error: ${response.status}`);
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
        throw new Error(`Error: ${response.status}`);
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

  async getCandidatosPorEstado(estado) {
    return this.get(`/candidato/por-estado/${estado}`);
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

  async actualizarFechaEntrevista(candidatoId, fecha) {
    return this.put(`/candidato/fecha-entrevista/${candidatoId}`, { fecha_citacion_entrevista: fecha });
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
}

export default new ApiService();