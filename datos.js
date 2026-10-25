/**
 * TechVolt - Configuración Inicial y Gestión de Persistencia
 * Archivo: datos.js
 * 
 * Capa de datos del cliente basada en Vanilla JavaScript y LocalStorage.
 */

const STORAGE_KEY = 'techvolt_data';

const CONFIG_INICIAL = {
  empresa: {
    nombre: "TechVolt",
    eslogan: "Servicio Eléctrico Residencial y Comercial",
    whatsapp: "522219829074",
    whatsappVisible: "221 982 9074",
    cobertura: "Tehuacán y zonas cercanas",
    passwordAdmin: "2026",
    notaMateriales: "Precios estimados de mano de obra. El material lo puede proporcionar el cliente o se cotiza aparte según la marca que prefiera."
  },

  servicios: [
    {
      id: "s1",
      categoria: "Instalación básica",
      nombre: "Instalación o cambio de contacto doble",
      descripcion: "Sustitución o colocación en caja existente con prueba de polaridad.",
      precio: 120,
      unidad: "por pieza"
    },
    {
      id: "s2",
      categoria: "Instalación básica",
      nombre: "Instalación o cambio de apagador",
      descripcion: "Apagador sencillo o de escalera en registro existente.",
      precio: 120,
      unidad: "por pieza"
    },
    {
      id: "s3",
      categoria: "Iluminación",
      nombre: "Colocación de lámpara o plafón LED",
      descripcion: "Montaje y conexión segura en techo o pared.",
      precio: 180,
      unidad: "por lámpara"
    },
    {
      id: "s4",
      categoria: "Iluminación",
      nombre: "Instalación de ventilador de techo",
      descripcion: "Armado, fijación estructural y conexión eléctrica.",
      precio: 380,
      unidad: "por equipo"
    },
    {
      id: "s5",
      categoria: "Protección y Carga",
      nombre: "Cambio de pastilla termomagnética (Breaker)",
      descripcion: "Reemplazo en centro de carga y ajuste de terminales.",
      precio: 250,
      unidad: "por pastilla"
    },
    {
      id: "s6",
      categoria: "Protección y Carga",
      nombre: "Instalación de centro de carga (2 a 4 circuitos)",
      descripcion: "Montaje y peinado de cables limpio y ordenado.",
      precio: 650,
      unidad: "por servicio"
    },
    {
      id: "s7",
      categoria: "Cableado nuevo",
      nombre: "Salida eléctrica nueva (Contacto o Lámpara)",
      descripcion: "Tendido de cableado nuevo por tubería existente.",
      precio: 300,
      unidad: "por salida"
    }
  ],

  sintomasDiagnostico: [
    {
      id: "d1",
      sintoma: "Se bota la pastilla (corto circuito o sobrecarga)",
      costoRevision: 250
    },
    {
      id: "d2",
      sintoma: "No hay luz en una habitación o zona de la casa",
      costoRevision: 250
    },
    {
      id: "d3",
      sintoma: "Los focos parpadean o baja la intensidad",
      costoRevision: 250
    },
    {
      id: "d4",
      sintoma: "Olor a cable quemado o chispazo en contacto",
      costoRevision: 250
    }
  ],

  /**
   * Trabajos realizados (Galería de proyectos / portafolio).
   * 
   * Estructura esperada de cada elemento:
   * {
   *   id: "t1",
   *   titulo: "Mantenimiento integral a centro de carga",
   *   descripcion: "Balanceo de cargas y sustitución de térmicos obsoletos.",
   *   imagenUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
   *   fecha: "2026-03-15"
   * }
   * 
   * Si el array está vacío ([]), el renderizado condicional oculta por completo
   * tanto el enlace de la cabecera como la sección visual en el frontend.
   * Al agregar al menos 1 elemento en el panel de administración, se despliega automáticamente.
   */
  trabajosRealizados: []
};

/**
 * Obtiene los datos del sistema desde localStorage o devuelve la configuración inicial.
 * @returns {Object} Datos actuales del sitio y catálogo
 */
function obtenerDatos() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return JSON.parse(JSON.stringify(CONFIG_INICIAL));
    }
    const parsedData = JSON.parse(rawData);
    return parsedData;
  } catch (error) {
    console.error("Error al leer datos desde localStorage, usando CONFIG_INICIAL:", error);
    return JSON.parse(JSON.stringify(CONFIG_INICIAL));
  }
}

/**
 * Guarda los datos actualizados en localStorage.
 * @param {Object} nuevosDatos - Objeto con la estructura completa de configuración
 * @returns {boolean} true si se guardó correctamente, false en caso de fallo
 */
function guardarDatos(nuevosDatos) {
  try {
    if (!nuevosDatos || typeof nuevosDatos !== 'object') {
      throw new Error("Datos inválidos proporcionados para almacenamiento.");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevosDatos));
    return true;
  } catch (error) {
    console.error("Error al guardar datos en localStorage:", error);
    return false;
  }
}

// Exposición en entorno global de navegador
if (typeof window !== 'undefined') {
  window.CONFIG_INICIAL = CONFIG_INICIAL;
  window.obtenerDatos = obtenerDatos;
  window.guardarDatos = guardarDatos;
}
