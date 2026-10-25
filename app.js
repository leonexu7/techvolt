/**
 * TechVolt - Lógica de Negocio, Cotizador Interactivo y Panel de Administración
 * Archivo: app.js
 * 
 * Implementación 100% Vanilla JavaScript pura sin frameworks ni dependencias externas.
 */

// Estado global de la aplicación
let appData = null;
let cantidadesServicios = {};
let sintomasSeleccionados = new Set();
let modoActivo = 'servicios'; // 'servicios' | 'diagnostico'

// Estado del panel de administración
let adminTempData = null;

// Control de activación secreta
let teclasBuffer = '';
let clicsLogoContador = 0;
let clicsLogoTimer = null;

/* ==========================================================================
   1. INICIALIZACIÓN
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Carga inicial de datos desde LocalStorage o CONFIG_INICIAL
  appData = typeof obtenerDatos === 'function' ? obtenerDatos() : null;

  if (!appData) {
    console.error("No se pudo cargar la configuración de datos.");
    return;
  }

  // Inicializar estado de cantidades para cada servicio
  inicializarEstadoCantidades();

  // Renderizar la interfaz pública completa
  renderizarTodo();

  // Configurar escuchadores de eventos
  configurarEventosUI();
  configurarHeroQuickActions();
  configurarEventosFAQ();
  configurarTriggersAdmin();
  configurarEventosAdmin();

  // Refrescar iconos Lucide
  refrescarIconos();
});

/**
 * Inicializa el diccionario de cantidades con 0 para cada servicio
 */
function inicializarEstadoCantidades() {
  cantidadesServicios = {};
  if (appData && Array.isArray(appData.servicios)) {
    appData.servicios.forEach(s => {
      cantidadesServicios[s.id] = 0;
    });
  }
}

/**
 * Actualiza los iconos Lucide en el DOM de forma segura
 */
function refrescarIconos() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Formatea un número como moneda en pesos mexicanos
 * @param {number} valor 
 * @returns {string} Ejemplo: "1,250"
 */
function formatearNumero(valor) {
  const num = Number(valor) || 0;
  return num.toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Determina la clase pastel adecuada según la categoría del servicio
 * @param {string} categoria 
 * @returns {string}
 */
function obtenerClasePastelCategoria(categoria) {
  const cat = (categoria || '').toLowerCase();
  if (cat.includes('básica') || cat.includes('basica')) {
    return 'pastel-azul';
  }
  if (cat.includes('iluminación') || cat.includes('iluminacion')) {
    return 'pastel-ambar';
  }
  if (cat.includes('protección') || cat.includes('proteccion') || cat.includes('carga')) {
    return 'pastel-salvia';
  }
  return 'pastel-azul';
}

/* ==========================================================================
   2. RENDERIZADO DE LA INTERFAZ PÚBLICA
   ========================================================================== */
function renderizarTodo() {
  renderizarTextosEmpresa();
  renderizarCatalogoServicios();
  renderizarSintomasDiagnostico();
  renderizarPortafolio();
  actualizarBarraPresupuesto();
  refrescarIconos();
}

/**
 * Carga los textos dinámicos de la empresa en header, cotizador y footer
 */
function renderizarTextosEmpresa() {
  const emp = appData.empresa;
  if (!emp) return;

  // Header
  const headerEslogan = document.getElementById('header-eslogan');
  if (headerEslogan) headerEslogan.textContent = emp.eslogan || 'Servicio Eléctrico';

  const textoCobertura = document.getElementById('texto-cobertura');
  if (textoCobertura) textoCobertura.textContent = emp.cobertura || 'Cobertura Local';

  const btnContactoHeader = document.getElementById('btn-contacto-header');
  if (btnContactoHeader) {
    const wsp = emp.whatsapp ? emp.whatsapp.replace(/\D/g, '') : '522219829074';
    const msg = encodeURIComponent(`Hola ${emp.nombre}, solicito informes sobre un servicio eléctrico en ${emp.cobertura}.`);
    btnContactoHeader.href = `https://wa.me/${wsp}?text=${msg}`;
  }

  // Nota de materiales en cotizador
  const notaMateriales = document.getElementById('nota-materiales-texto');
  if (notaMateriales) {
    notaMateriales.textContent = emp.notaMateriales || 'Precios estimados de mano de obra.';
  }

  // Botón Proyectos Especiales
  const btnProyectos = document.getElementById('btn-proyectos-especiales');
  if (btnProyectos) {
    const wsp = emp.whatsapp ? emp.whatsapp.replace(/\D/g, '') : '522219829074';
    const msg = encodeURIComponent(`Hola ${emp.nombre}, requiero asesoría técnica para un proyecto eléctrico mayor o comercial en Tehuacán.`);
    btnProyectos.href = `https://wa.me/${wsp}?text=${msg}`;
  }

  // Footer
  const footerEslogan = document.getElementById('footer-eslogan-texto');
  if (footerEslogan) footerEslogan.textContent = emp.eslogan;

  const footerCobertura = document.getElementById('footer-cobertura-texto');
  if (footerCobertura) footerCobertura.textContent = `Zona de Cobertura: ${emp.cobertura}`;

  const footerBtnWsp = document.getElementById('footer-btn-whatsapp');
  const footerNumVisible = document.getElementById('footer-numero-visible');
  if (footerBtnWsp && footerNumVisible) {
    const wsp = emp.whatsapp ? emp.whatsapp.replace(/\D/g, '') : '522219829074';
    footerNumVisible.textContent = emp.whatsappVisible || emp.whatsapp;
    const msg = encodeURIComponent(`Hola ${emp.nombre}, me pongo en contacto desde su sitio web.`);
    footerBtnWsp.href = `https://wa.me/${wsp}?text=${msg}`;
  }
}

/**
 * Renderiza la lista de servicios con sus controles y estados visuales (CRO)
 */
function renderizarCatalogoServicios() {
  const contenedor = document.getElementById('contenedor-servicios-catalogo');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  if (!appData.servicios || appData.servicios.length === 0) {
    contenedor.innerHTML = '<p class="text-center">No hay servicios registrados en este momento.</p>';
    return;
  }

  appData.servicios.forEach(s => {
    const cantidad = cantidadesServicios[s.id] || 0;
    const clasePastel = obtenerClasePastelCategoria(s.categoria);
    const estaSeleccionado = cantidad > 0;

    const card = document.createElement('div');
    card.className = `servicio-card ${estaSeleccionado ? 'seleccionado' : ''}`;
    card.dataset.id = s.id;

    card.innerHTML = `
      <div class="servicio-header">
        <div class="servicio-top-tags">
          <span class="servicio-categoria-tag ${clasePastel}">${s.categoria || 'Servicio'}</span>
          <span class="servicio-agregado-badge ${estaSeleccionado ? '' : 'oculto'}">
            <i data-lucide="check" class="icono-micro"></i> Agregado
          </span>
        </div>
        <h3 class="servicio-nombre">${s.nombre}</h3>
        <p class="servicio-descripcion">${s.descripcion}</p>
      </div>
      <div class="servicio-footer">
        <div class="servicio-precio-bloque">
          <span class="servicio-precio">$${formatearNumero(s.precio)}</span>
          <span class="servicio-unidad">${s.unidad || 'por pieza'}</span>
        </div>
        <div class="servicio-contador">
          <button type="button" class="btn-contador btn-restar" data-id="${s.id}" aria-label="Disminuir cantidad" ${cantidad === 0 ? 'disabled' : ''}>-</button>
          <span class="contador-valor" id="contador-${s.id}">${cantidad}</span>
          <button type="button" class="btn-contador btn-sumar" data-id="${s.id}" aria-label="Aumentar cantidad">+</button>
        </div>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

/**
 * Renderiza los síntomas de diagnóstico como tarjetas interactivas
 */
function renderizarSintomasDiagnostico() {
  const contenedor = document.getElementById('contenedor-sintomas-diagnostico');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  if (!appData.sintomasDiagnostico || appData.sintomasDiagnostico.length === 0) {
    contenedor.innerHTML = '<p class="text-center">No hay opciones de diagnóstico registradas.</p>';
    return;
  }

  appData.sintomasDiagnostico.forEach(d => {
    const seleccionado = sintomasSeleccionados.has(d.id);

    const card = document.createElement('div');
    card.className = `sintoma-card ${seleccionado ? 'seleccionado' : ''}`;
    card.dataset.id = d.id;
    card.role = 'checkbox';
    card.ariaChecked = seleccionado ? 'true' : 'false';
    card.tabIndex = 0;

    card.innerHTML = `
      <div class="sintoma-info">
        <div class="sintoma-checkbox">
          ${seleccionado ? '<i data-lucide="check" class="icono-pequeno"></i>' : ''}
        </div>
        <span class="sintoma-texto">${d.sintoma}</span>
      </div>
      <div class="sintoma-costo-bloque">
        <span class="sintoma-costo-etiqueta">Visita/Revisión:</span>
        <span class="sintoma-costo">$${formatearNumero(d.costoRevision)}</span>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

/**
 * Renderiza o esconde la sección del portafolio y el menú de navegación según trabajosRealizados
 */
function renderizarPortafolio() {
  const seccion = document.getElementById('seccion-portafolio');
  const navEnlace = document.getElementById('nav-enlace-portafolio');
  const grid = document.getElementById('grid-portafolio');

  if (!seccion || !navEnlace || !grid) return;

  const trabajos = appData.trabajosRealizados;

  // Si no hay trabajos cargados (length === 0), ocultar por completo
  if (!Array.isArray(trabajos) || trabajos.length === 0) {
    seccion.classList.add('oculto');
    navEnlace.classList.add('oculto');
    grid.innerHTML = '';
    return;
  }

  // Si hay al menos 1 elemento, mostrar
  seccion.classList.remove('oculto');
  navEnlace.classList.remove('oculto');
  grid.innerHTML = '';

  trabajos.forEach(t => {
    const card = document.createElement('div');
    card.className = 'portafolio-card';

    const imagenUrl = t.imagenUrl && t.imagenUrl.trim() !== '' 
      ? t.imagenUrl 
      : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80';

    card.innerHTML = `
      <div class="portafolio-imagen-contenedor">
        <img src="${imagenUrl}" alt="${t.titulo}" class="portafolio-img" loading="lazy">
      </div>
      <div class="portafolio-cuerpo">
        <h4 class="portafolio-titulo">${t.titulo}</h4>
        <p class="portafolio-desc">${t.descripcion}</p>
        ${t.fecha ? `<span class="portafolio-fecha">${t.fecha}</span>` : ''}
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ==========================================================================
   3. CÁLCULO EN TIEMPO REAL Y GENERADOR DE WHATSAPP
   ========================================================================== */

/**
 * Calcula el monto total y conteo de items seleccionados
 * @returns {{ total: number, conteo: number }}
 */
function calcularTotales() {
  let total = 0;
  let conteo = 0;

  // Sumatoria de servicios
  if (appData && Array.isArray(appData.servicios)) {
    appData.servicios.forEach(s => {
      const cant = cantidadesServicios[s.id] || 0;
      if (cant > 0) {
        total += cant * (Number(s.precio) || 0);
        conteo += cant;
      }
    });
  }

  // Sumatoria de síntomas de diagnóstico
  if (appData && Array.isArray(appData.sintomasDiagnostico)) {
    sintomasSeleccionados.forEach(id => {
      const sintoma = appData.sintomasDiagnostico.find(d => d.id === id);
      if (sintoma) {
        total += Number(sintoma.costoRevision) || 0;
        conteo += 1;
      }
    });
  }

  return { total, conteo };
}

/**
 * Actualiza la barra fija inferior con el total acumulado y conteo
 */
function actualizarBarraPresupuesto() {
  const barra = document.getElementById('barra-presupuesto');
  const txtContador = document.getElementById('resumen-contador-items');
  const txtTotal = document.getElementById('resumen-precio-total');

  if (!barra || !txtContador || !txtTotal) return;

  const { total, conteo } = calcularTotales();

  if (conteo > 0) {
    barra.classList.remove('oculto');
    txtContador.textContent = `${conteo} ${conteo === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}`;
    txtTotal.textContent = `$${formatearNumero(total)} MXN`;
  } else {
    barra.classList.add('oculto');
  }
}

/**
 * Genera el mensaje formateado de WhatsApp y abre la URL oficial de la API
 */
function enviarPresupuestoWhatsApp() {
  const emp = appData.empresa;
  const wsp = emp.whatsapp ? emp.whatsapp.replace(/\D/g, '') : '522219829074';
  const empresaNombre = (emp && emp.nombre) ? emp.nombre : 'TechVolt';
  const { total, conteo } = calcularTotales();

  if (conteo === 0) {
    alert("Por favor selecciona al menos un servicio o falla técnica para generar tu cotización.");
    return;
  }

  let lineas = [];
  lineas.push(`*SOLICITUD DE PRESUPUESTO - ${empresaNombre.toUpperCase()}*`);
  lineas.push(`Hola, me gustaría agendar un servicio técnico con los siguientes requerimientos:\n`);

  // Desglose de Servicios
  let tieneServicios = false;
  if (appData.servicios) {
    appData.servicios.forEach(s => {
      const cant = cantidadesServicios[s.id] || 0;
      if (cant > 0) {
        if (!tieneServicios) {
          lineas.push(`*TRABAJOS / INSTALACIONES SOLICITADAS:*`);
          tieneServicios = true;
        }
        const subtotal = cant * Number(s.precio);
        lineas.push(`- ${cant}x ${s.nombre} ($${formatearNumero(subtotal)} MXN) [${s.unidad}]`);
      }
    });
  }

  if (tieneServicios) {
    lineas.push('');
  }

  // Desglose de Diagnóstico
  if (sintomasSeleccionados.size > 0) {
    lineas.push(`*FALLAS / SÍNTOMAS PARA REVISIÓN TÉCNICA:*`);
    sintomasSeleccionados.forEach(id => {
      const sintoma = appData.sintomasDiagnostico.find(d => d.id === id);
      if (sintoma) {
        lineas.push(`- ${sintoma.sintoma} (Visita de diagnóstico: $${formatearNumero(sintoma.costoRevision)} MXN)`);
      }
    });
    lineas.push('');
  }

  // Total estimado y Nota
  lineas.push(`*TOTAL ESTIMADO MANO DE OBRA:* $${formatearNumero(total)} MXN`);
  lineas.push(`*NOTA:* ${emp.notaMateriales}`);
  lineas.push('');

  // Urgencia y Horario
  const urgenciaSeleccionada = document.querySelector('input[name="urgencia"]:checked');
  const valorUrgencia = urgenciaSeleccionada ? urgenciaSeleccionada.value : 'Para esta semana';
  lineas.push(`*PRIORIDAD / HORARIO:* ${valorUrgencia}`);

  // Colonia / Referencia
  const inputColonia = document.getElementById('input-colonia');
  const colonia = inputColonia && inputColonia.value.trim() !== '' ? inputColonia.value.trim() : 'No indicada (coordinar en chat)';
  lineas.push(`*COLONIA O REFERENCIA:* ${colonia}`);
  lineas.push('');
  lineas.push(`Quedo a la espera de su respuesta para confirmar el horario. Gracias.`);

  const mensajeCodificado = encodeURIComponent(lineas.join('\n'));
  const urlWhatsApp = `https://wa.me/${wsp}?text=${mensajeCodificado}`;

  window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
}

/* ==========================================================================
   4. EVENTOS DE LA INTERFAZ PRINCIPAL
   ========================================================================== */
function configurarEventosUI() {
  // Pestañas del Cotizador
  const btnTabServicios = document.getElementById('tab-btn-servicios');
  const btnTabDiagnostico = document.getElementById('tab-btn-diagnostico');
  const panelServicios = document.getElementById('panel-servicios');
  const panelDiagnostico = document.getElementById('panel-diagnostico');

  if (btnTabServicios && btnTabDiagnostico && panelServicios && panelDiagnostico) {
    btnTabServicios.addEventListener('click', () => {
      activarTabServicios();
    });

    btnTabDiagnostico.addEventListener('click', () => {
      activarTabDiagnostico();
    });
  }

  // Delegación de eventos para botones +/- en catálogo de servicios
  const contenedorServicios = document.getElementById('contenedor-servicios-catalogo');
  if (contenedorServicios) {
    contenedorServicios.addEventListener('click', (e) => {
      const btnSumar = e.target.closest('.btn-sumar');
      const btnRestar = e.target.closest('.btn-restar');

      if (btnSumar) {
        const id = btnSumar.dataset.id;
        cantidadesServicios[id] = (cantidadesServicios[id] || 0) + 1;
        actualizarCardServicio(id);
        actualizarBarraPresupuesto();
      } else if (btnRestar) {
        const id = btnRestar.dataset.id;
        if ((cantidadesServicios[id] || 0) > 0) {
          cantidadesServicios[id] -= 1;
          actualizarCardServicio(id);
          actualizarBarraPresupuesto();
        }
      }
    });
  }

  // Delegación de eventos para selección de síntomas
  const contenedorDiagnostico = document.getElementById('contenedor-sintomas-diagnostico');
  if (contenedorDiagnostico) {
    contenedorDiagnostico.addEventListener('click', (e) => {
      const card = e.target.closest('.sintoma-card');
      if (!card) return;

      const id = card.dataset.id;
      if (sintomasSeleccionados.has(id)) {
        sintomasSeleccionados.delete(id);
      } else {
        sintomasSeleccionados.add(id);
      }

      renderizarSintomasDiagnostico();
      actualizarBarraPresupuesto();
      refrescarIconos();
    });

    contenedorDiagnostico.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.sintoma-card');
        if (card) {
          e.preventDefault();
          card.click();
        }
      }
    });
  }

  // Botón principal de envío en la barra flotante
  const btnEnviar = document.getElementById('btn-enviar-whatsapp');
  if (btnEnviar) {
    btnEnviar.addEventListener('click', enviarPresupuestoWhatsApp);
  }

  // Radios de urgencia y campo de colonia refrescan la barra
  const radiosUrgencia = document.querySelectorAll('input[name="urgencia"]');
  radiosUrgencia.forEach(r => {
    r.addEventListener('change', actualizarBarraPresupuesto);
  });
}

function activarTabServicios() {
  const btnTabServicios = document.getElementById('tab-btn-servicios');
  const btnTabDiagnostico = document.getElementById('tab-btn-diagnostico');
  const panelServicios = document.getElementById('panel-servicios');
  const panelDiagnostico = document.getElementById('panel-diagnostico');

  modoActivo = 'servicios';
  if (btnTabServicios) {
    btnTabServicios.classList.add('activo');
    btnTabServicios.setAttribute('aria-selected', 'true');
  }
  if (btnTabDiagnostico) {
    btnTabDiagnostico.classList.remove('activo');
    btnTabDiagnostico.setAttribute('aria-selected', 'false');
  }
  if (panelServicios) panelServicios.classList.remove('oculto');
  if (panelDiagnostico) panelDiagnostico.classList.add('oculto');
}

function activarTabDiagnostico() {
  const btnTabServicios = document.getElementById('tab-btn-servicios');
  const btnTabDiagnostico = document.getElementById('tab-btn-diagnostico');
  const panelServicios = document.getElementById('panel-servicios');
  const panelDiagnostico = document.getElementById('panel-diagnostico');

  modoActivo = 'diagnostico';
  if (btnTabDiagnostico) {
    btnTabDiagnostico.classList.add('activo');
    btnTabDiagnostico.setAttribute('aria-selected', 'true');
  }
  if (btnTabServicios) {
    btnTabServicios.classList.remove('activo');
    btnTabServicios.setAttribute('aria-selected', 'false');
  }
  if (panelDiagnostico) panelDiagnostico.classList.remove('oculto');
  if (panelServicios) panelServicios.classList.add('oculto');
  refrescarIconos();
}

/**
 * Actualiza el DOM individual de un servicio tras presionar +/-
 * Cambia el estilo de la tarjeta a Verde Salvia suave cuando cantidad > 0
 * @param {string} id 
 */
function actualizarCardServicio(id) {
  const contadorEl = document.getElementById(`contador-${id}`);
  const card = document.querySelector(`.servicio-card[data-id="${id}"]`);
  if (!contadorEl || !card) return;

  const cantidad = cantidadesServicios[id] || 0;
  contadorEl.textContent = cantidad;

  const btnRestar = card.querySelector('.btn-restar');
  if (btnRestar) {
    btnRestar.disabled = cantidad === 0;
  }

  // Retroalimentación visual inmediata (CRO)
  const badgeAgregado = card.querySelector('.servicio-agregado-badge');
  if (cantidad > 0) {
    card.classList.add('seleccionado');
    if (badgeAgregado) badgeAgregado.classList.remove('oculto');
  } else {
    card.classList.remove('seleccionado');
    if (badgeAgregado) badgeAgregado.classList.add('oculto');
  }

  refrescarIconos();
}

/* ==========================================================================
   5. WIDGET INTERACTIVO DE ACCIÓN RÁPIDA DEL HERO (CRO)
   ========================================================================== */
function configurarHeroQuickActions() {
  const btnContactos = document.getElementById('btn-hero-contactos');
  const btnLamparas = document.getElementById('btn-hero-lamparas');
  const btnPastilla = document.getElementById('btn-hero-pastilla');
  const btnOtros = document.getElementById('btn-hero-otros');

  const scrollACotizador = (idElementoDestino) => {
    const cotizador = document.getElementById('cotizador');
    if (cotizador) {
      cotizador.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (idElementoDestino) {
      setTimeout(() => {
        const elemento = document.querySelector(`.servicio-card[data-id="${idElementoDestino}"]`) || 
                         document.querySelector(`.sintoma-card[data-id="${idElementoDestino}"]`);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  };

  if (btnContactos) {
    btnContactos.addEventListener('click', () => {
      activarTabServicios();
      // Si aún no está seleccionado, agregar 1 automáticamente
      if ((cantidadesServicios['s1'] || 0) === 0) {
        cantidadesServicios['s1'] = 1;
        actualizarCardServicio('s1');
        actualizarBarraPresupuesto();
      }
      scrollACotizador('s1');
    });
  }

  if (btnLamparas) {
    btnLamparas.addEventListener('click', () => {
      activarTabServicios();
      if ((cantidadesServicios['s3'] || 0) === 0) {
        cantidadesServicios['s3'] = 1;
        actualizarCardServicio('s3');
        actualizarBarraPresupuesto();
      }
      scrollACotizador('s3');
    });
  }

  if (btnPastilla) {
    btnPastilla.addEventListener('click', () => {
      activarTabDiagnostico();
      if (!sintomasSeleccionados.has('d1')) {
        sintomasSeleccionados.add('d1');
        renderizarSintomasDiagnostico();
        actualizarBarraPresupuesto();
        refrescarIconos();
      }
      scrollACotizador('d1');
    });
  }

  if (btnOtros) {
    btnOtros.addEventListener('click', () => {
      activarTabServicios();
      scrollACotizador();
    });
  }
}

/* ==========================================================================
   6. ACORDEÓN INTERACTIVO DE PREGUNTAS FRECUENTES (FAQ)
   ========================================================================== */
function configurarEventosFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const toggle = item.querySelector('.faq-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const estaActivo = item.classList.contains('activo');

      // Opcional: Cerrar los demás para mantener limpieza visual
      faqItems.forEach(otro => {
        if (otro !== item) {
          otro.classList.remove('activo');
          const t = otro.querySelector('.faq-toggle');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });

      if (estaActivo) {
        item.classList.remove('activo');
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('activo');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   7. ACTIVACIÓN DEL COMANDO SECRETO DE ADMINISTRADOR (3 VÍAS)
   ========================================================================== */
function configurarTriggersAdmin() {
  // Vía 1 y Vía 2: Teclado (Secuencia "techvolt" y atajo Ctrl + Shift + E)
  window.addEventListener('keydown', (e) => {
    // Vía 2: Atajo Ctrl + Shift + E (o Cmd + Shift + E en Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      e.preventDefault();
      abrirModalAdmin();
      return;
    }

    // Vía 1: Secuencia de letras "techvolt" (ignora inputs o textareas)
    const activo = document.activeElement;
    const esInput = activo && (
      activo.tagName === 'INPUT' || 
      activo.tagName === 'TEXTAREA' || 
      activo.tagName === 'SELECT' || 
      activo.isContentEditable
    );

    if (esInput) return;

    if (e.key && e.key.length === 1) {
      teclasBuffer += e.key.toLowerCase();
      if (teclasBuffer.length > 20) {
        teclasBuffer = teclasBuffer.slice(-20);
      }
      if (teclasBuffer.endsWith('techvolt')) {
        teclasBuffer = '';
        abrirModalAdmin();
      }
    }
  });

  // Vía 3: Móvil / Táctil (5 clics en #logo-secreto en menos de 3 segundos)
  const logo = document.getElementById('logo-secreto');
  if (logo) {
    logo.addEventListener('click', () => {
      clicsLogoContador++;

      if (clicsLogoTimer) {
        clearTimeout(clicsLogoTimer);
      }

      if (clicsLogoContador >= 5) {
        clicsLogoContador = 0;
        abrirModalAdmin();
        return;
      }

      clicsLogoTimer = setTimeout(() => {
        clicsLogoContador = 0;
      }, 3000);
    });
  }
}

/* ==========================================================================
   8. CONTROL DEL MODAL DE ADMINISTRACIÓN
   ========================================================================== */
function abrirModalAdmin() {
  const modal = document.getElementById('modal-admin');
  const vistaLogin = document.getElementById('admin-vista-login');
  const vistaPanel = document.getElementById('admin-vista-panel');
  const modalFooter = document.getElementById('admin-modal-footer');
  const passInput = document.getElementById('admin-pass-input');
  const loginError = document.getElementById('admin-login-error');

  if (!modal || !vistaLogin || !vistaPanel || !modalFooter) return;

  adminTempData = JSON.parse(JSON.stringify(appData));

  // Reiniciar a Vista 1 (Login)
  vistaLogin.classList.remove('oculto');
  vistaPanel.classList.add('oculto');
  modalFooter.classList.add('oculto');

  if (loginError) loginError.classList.add('oculto');
  if (passInput) {
    passInput.value = '';
    setTimeout(() => passInput.focus(), 150);
  }

  modal.classList.remove('oculto');
  refrescarIconos();
}

function cerrarModalAdmin() {
  const modal = document.getElementById('modal-admin');
  if (modal) {
    modal.classList.add('oculto');
  }
}

function configurarEventosAdmin() {
  // Botón Cerrar
  const btnCerrar = document.getElementById('btn-cerrar-admin');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModalAdmin);
  }

  // Cerrar al hacer clic en el backdrop
  const modal = document.getElementById('modal-admin');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModalAdmin();
      }
    });
  }

  // Formulario de Login Admin
  const formLogin = document.getElementById('form-admin-login');
  const passInput = document.getElementById('admin-pass-input');
  const loginError = document.getElementById('admin-login-error');

  const procesarLogin = () => {
    const passwordIngresado = passInput ? passInput.value.trim() : '';
    const passwordValido = (appData.empresa && appData.empresa.passwordAdmin) 
      ? String(appData.empresa.passwordAdmin).trim() 
      : '2026';

    if (passwordIngresado === passwordValido) {
      if (loginError) loginError.classList.add('oculto');
      desbloquearPanelAdmin();
    } else {
      if (loginError) {
        loginError.classList.remove('oculto');
      }
      if (passInput) {
        passInput.select();
        passInput.focus();
      }
    }
  };

  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      procesarLogin();
    });
  }

  const btnLoginSubmit = document.getElementById('btn-admin-login-submit');
  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener('click', procesarLogin);
  }

  // Pestañas internas del panel
  const subtabBtns = document.querySelectorAll('.admin-subtab-btn');
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabBtns.forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');

      const targetId = btn.dataset.target;
      document.querySelectorAll('.admin-tab-contenido').forEach(tab => {
        tab.classList.add('oculto');
        tab.classList.remove('activo');
      });

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.classList.remove('oculto');
        targetEl.classList.add('activo');
      }
      refrescarIconos();
    });
  });

  // Botón "+ Nuevo Servicio"
  const btnNuevoServicio = document.getElementById('btn-admin-agregar-servicio');
  if (btnNuevoServicio) {
    btnNuevoServicio.addEventListener('click', () => {
      const nuevoId = 's_' + Date.now();
      adminTempData.servicios.push({
        id: nuevoId,
        categoria: 'General',
        nombre: 'Nuevo Servicio Eléctrico',
        descripcion: 'Descripción del trabajo a realizar.',
        precio: 150,
        unidad: 'por servicio'
      });
      renderizarAdminServicios();
    });
  }

  // Botón "Agregar a la Galería" (Trabajos Realizados)
  const btnGuardarTrabajo = document.getElementById('btn-admin-guardar-trabajo');
  if (btnGuardarTrabajo) {
    btnGuardarTrabajo.addEventListener('click', () => {
      const inputTitulo = document.getElementById('nuevo-trabajo-titulo');
      const inputImg = document.getElementById('nuevo-trabajo-imagen');
      const inputDesc = document.getElementById('nuevo-trabajo-descripcion');

      const titulo = inputTitulo ? inputTitulo.value.trim() : '';
      const imagenUrl = inputImg ? inputImg.value.trim() : '';
      const descripcion = inputDesc ? inputDesc.value.trim() : '';

      if (!titulo || !descripcion) {
        alert("Por favor ingresa al menos un título y descripción para el trabajo realizado.");
        return;
      }

      const nuevoTrabajo = {
        id: 't_' + Date.now(),
        titulo: titulo,
        imagenUrl: imagenUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        descripcion: descripcion,
        fecha: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })
      };

      if (!Array.isArray(adminTempData.trabajosRealizados)) {
        adminTempData.trabajosRealizados = [];
      }

      adminTempData.trabajosRealizados.unshift(nuevoTrabajo);

      // Limpiar campos
      if (inputTitulo) inputTitulo.value = '';
      if (inputImg) inputImg.value = '';
      if (inputDesc) inputDesc.value = '';

      renderizarAdminTrabajos();
    });
  }

  // Acciones finales:
  // 1. Guardar Cambios
  const btnGuardar = document.getElementById('btn-admin-guardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarCambiosAdmin);
  }

  // 2. Descargar datos.js actualizado
  const btnDescargar = document.getElementById('btn-admin-descargar');
  if (btnDescargar) {
    btnDescargar.addEventListener('click', descargarArchivoDatos);
  }

  // 3. Restaurar Valores de Fábrica
  const btnRestaurar = document.getElementById('btn-admin-restaurar');
  if (btnRestaurar) {
    btnRestaurar.addEventListener('click', restaurarValoresFabrica);
  }
}

/**
 * Muestra el panel completo tras autenticarse con éxito
 */
function desbloquearPanelAdmin() {
  const vistaLogin = document.getElementById('admin-vista-login');
  const vistaPanel = document.getElementById('admin-vista-panel');
  const modalFooter = document.getElementById('admin-modal-footer');

  if (vistaLogin) vistaLogin.classList.add('oculto');
  if (vistaPanel) vistaPanel.classList.remove('oculto');
  if (modalFooter) modalFooter.classList.remove('oculto');

  cargarDatosEnFormularioGeneral();
  renderizarAdminServicios();
  renderizarAdminTrabajos();
  refrescarIconos();
}

/**
 * Carga los valores de empresa en los inputs del panel
 */
function cargarDatosEnFormularioGeneral() {
  const emp = adminTempData.empresa || {};

  setInputValue('admin-input-nombre', emp.nombre || '');
  setInputValue('admin-input-eslogan', emp.eslogan || '');
  setInputValue('admin-input-wsp', emp.whatsapp || '');
  setInputValue('admin-input-wsp-visible', emp.whatsappVisible || '');
  setInputValue('admin-input-cobertura', emp.cobertura || '');
  setInputValue('admin-input-password', emp.passwordAdmin || '2026');
  setInputValue('admin-input-nota-materiales', emp.notaMateriales || '');
}

function setInputValue(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor;
}

/**
 * Renderiza la lista de servicios editables en el panel de administración
 */
function renderizarAdminServicios() {
  const contenedor = document.getElementById('admin-lista-servicios-contenedor');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  adminTempData.servicios.forEach((s, index) => {
    const item = document.createElement('div');
    item.className = 'admin-servicio-item';
    item.dataset.index = index;

    item.innerHTML = `
      <div class="form-grupo">
        <label>Nombre:</label>
        <input type="text" class="input-control adm-srv-nombre" value="${s.nombre}">
      </div>
      <div class="form-grupo">
        <label>Categoría:</label>
        <input type="text" class="input-control adm-srv-categoria" value="${s.categoria || 'General'}">
      </div>
      <div class="form-grupo">
        <label>Precio ($):</label>
        <input type="number" class="input-control adm-srv-precio text-center tabular-nums" value="${s.precio}" min="0" step="10">
      </div>
      <div class="admin-servicio-item-controles">
        <button type="button" class="btn btn-sm btn-peligro btn-eliminar-servicio" data-index="${index}" title="Eliminar servicio">
          <i data-lucide="trash-2" class="icono-pequeno"></i>
        </button>
      </div>
    `;

    const inputNombre = item.querySelector('.adm-srv-nombre');
    const inputCategoria = item.querySelector('.adm-srv-categoria');
    const inputPrecio = item.querySelector('.adm-srv-precio');
    const btnEliminar = item.querySelector('.btn-eliminar-servicio');

    inputNombre.addEventListener('input', (e) => {
      adminTempData.servicios[index].nombre = e.target.value;
    });

    inputCategoria.addEventListener('input', (e) => {
      adminTempData.servicios[index].categoria = e.target.value;
    });

    inputPrecio.addEventListener('input', (e) => {
      adminTempData.servicios[index].precio = Number(e.target.value) || 0;
    });

    btnEliminar.addEventListener('click', () => {
      if (confirm(`¿Eliminar "${adminTempData.servicios[index].nombre}"?`)) {
        adminTempData.servicios.splice(index, 1);
        renderizarAdminServicios();
      }
    });

    contenedor.appendChild(item);
  });

  refrescarIconos();
}

/**
 * Renderiza la lista de trabajos realizados con opción de borrar
 */
function renderizarAdminTrabajos() {
  const contenedor = document.getElementById('admin-lista-trabajos-contenedor');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  const trabajos = adminTempData.trabajosRealizados || [];

  if (trabajos.length === 0) {
    contenedor.innerHTML = '<p class="text-center input-ayuda">No hay proyectos en la galería. La sección pública estará oculta.</p>';
    return;
  }

  trabajos.forEach((t, index) => {
    const item = document.createElement('div');
    item.className = 'admin-trabajo-item';

    item.innerHTML = `
      <img src="${t.imagenUrl}" alt="${t.titulo}" class="admin-trabajo-miniatura" onerror="this.src='https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=60'">
      <div class="admin-trabajo-meta">
        <h6 class="admin-trabajo-titulo">${t.titulo}</h6>
        <p class="admin-trabajo-sub">${t.descripcion}</p>
      </div>
      <button type="button" class="btn btn-sm btn-peligro btn-eliminar-trabajo" data-index="${index}" title="Eliminar proyecto">
        <i data-lucide="trash-2" class="icono-pequeno"></i>
      </button>
    `;

    const btnEliminar = item.querySelector('.btn-eliminar-trabajo');
    btnEliminar.addEventListener('click', () => {
      if (confirm(`¿Eliminar el proyecto "${t.titulo}" de la galería?`)) {
        adminTempData.trabajosRealizados.splice(index, 1);
        renderizarAdminTrabajos();
      }
    });

    contenedor.appendChild(item);
  });

  refrescarIconos();
}

/**
 * Recopila todos los inputs y persiste los cambios en LocalStorage y vista pública
 */
function guardarCambiosAdmin() {
  const nombre = document.getElementById('admin-input-nombre')?.value.trim();
  const eslogan = document.getElementById('admin-input-eslogan')?.value.trim();
  const whatsapp = document.getElementById('admin-input-wsp')?.value.trim();
  const whatsappVisible = document.getElementById('admin-input-wsp-visible')?.value.trim();
  const cobertura = document.getElementById('admin-input-cobertura')?.value.trim();
  const passwordAdmin = document.getElementById('admin-input-password')?.value.trim();
  const notaMateriales = document.getElementById('admin-input-nota-materiales')?.value.trim();

  adminTempData.empresa = {
    ...adminTempData.empresa,
    nombre: nombre || 'TechVolt',
    eslogan: eslogan || 'Servicio Eléctrico Residencial y Comercial',
    whatsapp: whatsapp || '522219829074',
    whatsappVisible: whatsappVisible || '221 982 9074',
    cobertura: cobertura || 'Tehuacán y zonas cercanas',
    passwordAdmin: passwordAdmin || '2026',
    notaMateriales: notaMateriales || 'Precios estimados de mano de obra.'
  };

  const exito = typeof guardarDatos === 'function' ? guardarDatos(adminTempData) : false;

  if (exito) {
    appData = JSON.parse(JSON.stringify(adminTempData));

    appData.servicios.forEach(s => {
      if (cantidadesServicios[s.id] === undefined) {
        cantidadesServicios[s.id] = 0;
      }
    });

    // Actualiza la vista pública completa en vivo al instante (incluyendo portafolio)
    renderizarTodo();

    cerrarModalAdmin();

    alert("¡Los cambios se guardaron exitosamente en el navegador!");
  } else {
    alert("Ocurrió un error al intentar guardar los datos en localStorage.");
  }
}

/**
 * Genera el archivo datos.js actualizado y dispara la descarga con Blob
 */
function descargarArchivoDatos() {
  const nombre = document.getElementById('admin-input-nombre')?.value.trim() || adminTempData.empresa.nombre;
  const eslogan = document.getElementById('admin-input-eslogan')?.value.trim() || adminTempData.empresa.eslogan;
  const whatsapp = document.getElementById('admin-input-wsp')?.value.trim() || adminTempData.empresa.whatsapp;
  const whatsappVisible = document.getElementById('admin-input-wsp-visible')?.value.trim() || adminTempData.empresa.whatsappVisible;
  const cobertura = document.getElementById('admin-input-cobertura')?.value.trim() || adminTempData.empresa.cobertura;
  const passwordAdmin = document.getElementById('admin-input-password')?.value.trim() || adminTempData.empresa.passwordAdmin;
  const notaMateriales = document.getElementById('admin-input-nota-materiales')?.value.trim() || adminTempData.empresa.notaMateriales;

  const datosExportar = {
    ...adminTempData,
    empresa: {
      nombre,
      eslogan,
      whatsapp,
      whatsappVisible,
      cobertura,
      passwordAdmin,
      notaMateriales
    }
  };

  const contenidoArchivo = `/**
 * TechVolt - Configuración Inicial y Gestión de Persistencia
 * Archivo: datos.js
 * 
 * Generado automáticamente desde el Panel de Administración TechVolt
 * Fecha de exportación: ${new Date().toISOString()}
 */

const STORAGE_KEY = 'techvolt_data';

const CONFIG_INICIAL = ${JSON.stringify(datosExportar, null, 2)};

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
`;

  const blob = new Blob([contenidoArchivo], { type: 'application/javascript;charset=utf-8' });
  const urlDescarga = URL.createObjectURL(blob);
  const enlace = document.createElement('a');

  enlace.href = urlDescarga;
  enlace.download = 'datos.js';
  document.body.appendChild(enlace);
  enlace.click();

  document.body.removeChild(enlace);
  URL.revokeObjectURL(urlDescarga);
}

/**
 * Restaura la configuración a los valores originales de fábrica
 */
function restaurarValoresFabrica() {
  const confirmacion = confirm(
    "¿Estás seguro de restaurar todos los valores de fábrica?\n\nSe eliminarán los cambios locales guardados y volverás a la configuración por defecto de datos.js."
  );

  if (confirmacion) {
    localStorage.removeItem('techvolt_data');
    if (typeof CONFIG_INICIAL !== 'undefined') {
      appData = JSON.parse(JSON.stringify(CONFIG_INICIAL));
      adminTempData = JSON.parse(JSON.stringify(CONFIG_INICIAL));
    }
    inicializarEstadoCantidades();
    sintomasSeleccionados.clear();
    renderizarTodo();
    desbloquearPanelAdmin();
    alert("Se han restablecido los valores de fábrica con éxito.");
  }
}
