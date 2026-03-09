// ====================
// CONFIGURACIÓN
// ====================
const CONFIG = {
    LOCALE: 'es-CL',
    STORAGE_KEY: 'propuesta_formulario',
    EMAIL_DESTINO: 'sergioseguel81@gmail.com', // Sergio Seguel
    EMAIL_CLIENTE: 'carlosmarchantparra@gmail.com', // Carlos Marchant
    AUTO_SAVE_DELAY: 2000,

    // Precios por complejidad
    PRECIOS: {
        simple: 10000,
        medio: 13000,
        complejo: 18000,
        rediseno: 20000
    },

    // Complejidad de cada logo
    LOGOS: {
        logo1: { nombre: 'Cock Sparrer', complejidad: 'simple' },
        logo2: { nombre: 'Vasco da Gama', complejidad: 'simple' },
        logo3: { nombre: 'Abeja Lineal', complejidad: 'rediseno' },
        logo4: { nombre: 'ZTP Óvalo', complejidad: 'complejo' },
        logo5: { nombre: 'ZINTROP Cerveza', complejidad: 'complejo' },
        logo6: { nombre: 'ZINTROP Escudo', complejidad: 'complejo' },
        logo7: { nombre: 'PZPN Águila', complejidad: 'simple' },
        logo8: { nombre: 'ZINTROP Fútbol v1', complejidad: 'medio' },
        logo9: { nombre: 'ZINTROP Fútbol v2', complejidad: 'medio' }
    },

    // Dependencias: logos que requieren logo 3 si eligen usar su diseño de abeja
    DEPENDENCIAS_LOGO3: ['logo6', 'logo8']
};

// Elementos del DOM
const formulario = document.getElementById('formulario');
const logosCount = document.getElementById('logos-count');
const totalPrecio = document.getElementById('total-precio');
const guardadoIndicator = document.getElementById('guardado-indicator');

// Obtener todos los checkboxes de "incluir"
const checkboxes = document.querySelectorAll('input[name$="_incluir"]');

// ====================
// TOAST NOTIFICATIONS
// ====================
function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.setAttribute('role', 'status');

    const iconos = {
        success: '&#10003;',
        error: '&#10007;',
        warning: '&#9888;',
        info: '&#8505;'
    };

    toast.innerHTML = `<span>${iconos[tipo] || ''}</span><span>${mensaje}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

// ====================
// PERSISTENCIA LOCALSTORAGE
// ====================
let saveTimeout;
let ultimoGuardado = null;

function guardarFormulario() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        guardarDatos();
    }, CONFIG.AUTO_SAVE_DELAY);
}

function guardarDatos() {
    const formData = new FormData(formulario);
    const data = {};

    formData.forEach((value, key) => {
        data[key] = value;
    });

    // Guardar checkboxes no marcados también
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        data[cb.name] = cb.checked;
    });

    data._timestamp = Date.now();
    ultimoGuardado = data._timestamp;
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));

    // Actualizar indicador de estado
    actualizarEstadoGuardado();
}

function guardarManual() {
    clearTimeout(saveTimeout);
    guardarDatos();
    mostrarToast('Borrador guardado correctamente', 'success');
}

function actualizarEstadoGuardado() {
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');

    if (!statusIcon || !statusText) return;

    if (ultimoGuardado) {
        statusIcon.textContent = '✓';
        statusText.textContent = 'Guardado ' + tiempoRelativo(ultimoGuardado);
        statusText.classList.add('saved');
    }
}

function tiempoRelativo(timestamp) {
    const ahora = Date.now();
    const diff = ahora - timestamp;

    if (diff < 5000) return 'ahora';
    if (diff < 60000) return 'hace ' + Math.floor(diff / 1000) + ' seg';
    if (diff < 3600000) return 'hace ' + Math.floor(diff / 60000) + ' min';
    if (diff < 86400000) return 'hace ' + Math.floor(diff / 3600000) + ' horas';
    return 'hace ' + Math.floor(diff / 86400000) + ' días';
}

// Actualizar tiempo relativo cada 30 segundos
setInterval(() => {
    if (ultimoGuardado) {
        actualizarEstadoGuardado();
    }
}, 30000);

function cargarFormulario() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!saved) return false;

    try {
        const data = JSON.parse(saved);
        const timestamp = data._timestamp;

        // Si tiene más de 7 días, no cargar
        if (timestamp && Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return false;
        }

        Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith('_')) return;

            const input = document.querySelector(`[name="${key}"]`);
            if (!input) return;

            if (input.type === 'checkbox') {
                input.checked = value === true || value === 'on';
            } else if (input.type === 'radio') {
                const radio = document.querySelector(`[name="${key}"][value="${value}"]`);
                if (radio) radio.checked = true;
            } else {
                input.value = value;
            }
        });

        // Establecer tiempo de último guardado
        if (timestamp) {
            ultimoGuardado = timestamp;
            actualizarEstadoGuardado();
        }

        return true;
    } catch (e) {
        console.error('Error cargando formulario:', e);
        return false;
    }
}

function limpiarFormulario() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    formulario.reset();
    ultimoGuardado = null;

    // Resetear indicador de estado
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    if (statusIcon) statusIcon.textContent = '💾';
    if (statusText) {
        statusText.textContent = 'Sin cambios guardados';
        statusText.classList.remove('saved');
    }

    actualizarTotal();
    mostrarToast('Formulario limpiado', 'info');
}

function confirmarLimpiar() {
    const modal = document.getElementById('modal-limpiar');
    if (modal) {
        modal.classList.add('visible');
    }
}

function cerrarModal() {
    const modal = document.getElementById('modal-limpiar');
    if (modal) {
        modal.classList.remove('visible');
    }
}

function ejecutarLimpiar() {
    cerrarModal();
    limpiarFormulario();
}

// ====================
// VALIDACIÓN
// ====================
function validarFormulario() {
    const aceptado = document.getElementById('aceptar-propuesta');
    const logosSeleccionados = document.querySelectorAll('[name$="_incluir"]:checked').length;

    if (logosSeleccionados === 0) {
        mostrarToast('Debes seleccionar al menos un logo', 'warning');
        return false;
    }

    if (!aceptado || !aceptado.checked) {
        mostrarToast('Debes aceptar los términos de la propuesta', 'warning');
        if (aceptado) {
            aceptado.focus();
            aceptado.closest('.aceptacion-box').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
    }

    return true;
}

// ====================
// ACTUALIZAR TOTAL
// ====================
function actualizarTotal() {
    let total = 0;
    let seleccionados = 0;

    // Calcular precio según complejidad de cada logo seleccionado
    for (let i = 1; i <= 9; i++) {
        const checkbox = document.querySelector(`input[name="logo${i}_incluir"]`);
        if (checkbox && checkbox.checked) {
            seleccionados++;
            const logoKey = `logo${i}`;
            const logoInfo = CONFIG.LOGOS[logoKey];
            if (logoInfo) {
                total += CONFIG.PRECIOS[logoInfo.complejidad];
            }
        }
    }

    if (logosCount) logosCount.textContent = seleccionados;
    if (totalPrecio) totalPrecio.textContent = formatearPrecio(total);

    // Actualizar desglose si existe
    actualizarDesglose();

    // Actualizar visual de las tarjetas
    checkboxes.forEach(checkbox => {
        const card = checkbox.closest('.form-logo-card');
        if (!card) return;

        const body = card.querySelector('.form-logo-body');
        if (checkbox.checked) {
            card.style.opacity = '1';
            if (body) body.style.display = 'block';
        } else {
            card.style.opacity = '0.6';
            if (body) body.style.display = 'none';
        }
    });

    // Auto-guardar
    guardarFormulario();
}

function actualizarDesglose() {
    const desglose = document.getElementById('precio-desglose');
    if (!desglose) return;

    let items = [];
    let conteo = { simple: 0, medio: 0, complejo: 0, rediseno: 0 };

    for (let i = 1; i <= 9; i++) {
        const checkbox = document.querySelector(`input[name="logo${i}_incluir"]`);
        if (checkbox && checkbox.checked) {
            const logoInfo = CONFIG.LOGOS[`logo${i}`];
            if (logoInfo) {
                conteo[logoInfo.complejidad]++;
            }
        }
    }

    if (conteo.simple > 0) {
        items.push(`${conteo.simple} simple${conteo.simple > 1 ? 's' : ''} ($10k)`);
    }
    if (conteo.medio > 0) {
        items.push(`${conteo.medio} medio${conteo.medio > 1 ? 's' : ''} ($13k)`);
    }
    if (conteo.complejo > 0) {
        items.push(`${conteo.complejo} complejo${conteo.complejo > 1 ? 's' : ''} ($18k)`);
    }
    if (conteo.rediseno > 0) {
        items.push(`${conteo.rediseno} rediseño ($20k)`);
    }

    if (items.length > 0) {
        desglose.innerHTML = items.map(i => `<span class="desglose-item">${i}</span>`).join('');
    } else {
        desglose.innerHTML = '';
    }
}

// Formatear precio
function formatearPrecio(numero) {
    return '$' + numero.toLocaleString(CONFIG.LOCALE);
}

// ====================
// COPIAR RESUMEN
// ====================
function copiarResumen() {
    if (!validarFormulario()) return;

    const resumen = generarResumen();

    navigator.clipboard.writeText(resumen).then(() => {
        mostrarToast('Resumen copiado al portapapeles', 'success');
    }).catch(err => {
        // Fallback para navegadores que no soportan clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = resumen;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarToast('Resumen copiado al portapapeles', 'success');
    });
}

// ====================
// ENVIAR CORREO
// ====================
function enviarCorreo() {
    // Mostrar resumen primero para confirmación
    mostrarResumen();
}

// ====================
// GENERAR RESUMEN
// ====================
function generarResumen() {
    let resumen = '=== PROPUESTA DE VECTORIZACIÓN ===\n';
    resumen += `Fecha: ${new Date().toLocaleDateString('es-CL')}\n\n`;

    // Logos seleccionados
    resumen += 'LOGOS SELECCIONADOS:\n';
    resumen += '─────────────────────\n';

    let total = 0;
    let seleccionados = 0;

    for (let i = 1; i <= 9; i++) {
        const checkbox = document.querySelector(`input[name="logo${i}_incluir"]`);
        if (checkbox && checkbox.checked) {
            seleccionados++;
            const logoKey = `logo${i}`;
            const logoInfo = CONFIG.LOGOS[logoKey];
            const precio = CONFIG.PRECIOS[logoInfo.complejidad];
            total += precio;

            resumen += `\n${i}. ${logoInfo.nombre} (${formatearPrecio(precio)})\n`;

            // Obtener opciones seleccionadas
            const radios = document.querySelectorAll(`input[name^="${logoKey}_"]:checked`);
            radios.forEach(radio => {
                if (radio.name !== `${logoKey}_incluir`) {
                    const label = radio.closest('label');
                    if (label) {
                        resumen += `   • ${label.textContent.trim()}\n`;
                    }
                }
            });

            // Notas
            const notas = document.querySelector(`textarea[name="${logoKey}_notas"]`);
            if (notas && notas.value.trim()) {
                resumen += `   Notas: ${notas.value.trim()}\n`;
            }
        }
    }

    // Información general
    resumen += '\n\nINFORMACIÓN GENERAL:\n';
    resumen += '─────────────────────\n';

    const usoPrincipal = document.querySelector('textarea[name="uso_principal"]');
    if (usoPrincipal && usoPrincipal.value.trim()) {
        resumen += `Uso: ${usoPrincipal.value.trim()}\n`;
    }

    const pagoSeleccionado = document.querySelector('input[name="pago"]:checked');
    if (pagoSeleccionado) {
        const pagoLabel = pagoSeleccionado.closest('label');
        if (pagoLabel) {
            resumen += `Pago: ${pagoLabel.textContent.trim()}\n`;
        }
    }

    const comentarios = document.querySelector('textarea[name="comentarios"]');
    if (comentarios && comentarios.value.trim()) {
        resumen += `Comentarios: ${comentarios.value.trim()}\n`;
    }

    // Total
    resumen += '\n─────────────────────\n';
    resumen += `TOTAL: ${seleccionados} logos = ${formatearPrecio(total)}\n`;
    resumen += '─────────────────────\n';

    resumen += '\nPropuesta aceptada: Sí\n';

    return resumen;
}

// ====================
// MODAL DE RESUMEN
// ====================
function mostrarResumen() {
    if (!validarFormulario()) return;

    const modalResumen = document.getElementById('modal-resumen');
    const resumenBody = document.getElementById('resumen-body');
    const resumenTotal = document.getElementById('resumen-total');

    // Generar contenido del resumen
    let html = '';
    let total = 0;
    let seleccionados = 0;
    let conteo = { simple: 0, medio: 0, complejo: 0, rediseno: 0 };

    for (let i = 1; i <= 9; i++) {
        const checkbox = document.querySelector(`input[name="logo${i}_incluir"]`);
        if (checkbox && checkbox.checked) {
            seleccionados++;
            const logoKey = `logo${i}`;
            const logoInfo = CONFIG.LOGOS[logoKey];
            const precio = CONFIG.PRECIOS[logoInfo.complejidad];
            total += precio;
            conteo[logoInfo.complejidad]++;

            // Obtener imagen
            const imgSrc = document.querySelector(`.form-logo-card:nth-of-type(${i}) img`)?.src || `logos/0${i}-placeholder.jpg`;

            // Obtener detalles relevantes
            let detalles = [];

            // Color/Estilo
            const colorRadio = document.querySelector(`input[name="${logoKey}_color"]:checked, input[name="${logoKey}_efecto"]:checked, input[name="${logoKey}_estilo"]:checked`);
            if (colorRadio) {
                const colorLabel = colorRadio.closest('label');
                if (colorLabel) detalles.push(colorLabel.textContent.trim());
            }

            // Notas
            const notas = document.querySelector(`textarea[name="${logoKey}_notas"]`);
            if (notas && notas.value.trim()) {
                detalles.push(`"${notas.value.trim().substring(0, 50)}${notas.value.length > 50 ? '...' : ''}"`);
            }

            const badgeClass = `badge-${logoInfo.complejidad}`;

            html += `
                <div class="resumen-logo-item">
                    <img src="${imgSrc}" alt="${logoInfo.nombre}" class="resumen-logo-img">
                    <div class="resumen-logo-info">
                        <div class="resumen-logo-name">
                            ${i}. ${logoInfo.nombre}
                            <span class="badge ${badgeClass}" style="margin-left:8px">${logoInfo.complejidad}</span>
                        </div>
                        <div class="resumen-logo-detalles">${detalles.join(' • ') || 'Sin notas adicionales'}</div>
                    </div>
                    <div class="resumen-logo-precio">${formatearPrecio(precio)}</div>
                </div>
            `;
        }
    }

    // Construir desglose
    let desglose = [];
    if (conteo.simple > 0) desglose.push(`${conteo.simple} simple${conteo.simple > 1 ? 's' : ''}`);
    if (conteo.medio > 0) desglose.push(`${conteo.medio} medio${conteo.medio > 1 ? 's' : ''}`);
    if (conteo.complejo > 0) desglose.push(`${conteo.complejo} complejo${conteo.complejo > 1 ? 's' : ''}`);
    if (conteo.rediseno > 0) desglose.push(`${conteo.rediseno} rediseño`);

    resumenBody.innerHTML = html;
    resumenTotal.innerHTML = `
        <div class="resumen-total-linea">
            <span class="resumen-total-label">${seleccionados} logos seleccionados</span>
            <span class="resumen-total-valor">${formatearPrecio(total)}</span>
        </div>
        <div class="resumen-total-desglose">${desglose.join(' + ')}</div>
    `;

    modalResumen.classList.add('visible');
}

function cerrarResumen() {
    const modalResumen = document.getElementById('modal-resumen');
    if (modalResumen) {
        modalResumen.classList.remove('visible');
    }
}

function confirmarYEnviar() {
    cerrarResumen();
    enviarCorreoDirecto();
}

function enviarCorreoDirecto() {
    const resumen = generarResumen();

    // Calcular total para el asunto
    let total = 0;
    let seleccionados = 0;
    for (let i = 1; i <= 9; i++) {
        const checkbox = document.querySelector(`input[name="logo${i}_incluir"]`);
        if (checkbox && checkbox.checked) {
            seleccionados++;
            const logoInfo = CONFIG.LOGOS[`logo${i}`];
            total += CONFIG.PRECIOS[logoInfo.complejidad];
        }
    }

    const asunto = encodeURIComponent(`Propuesta Vectorización - ${seleccionados} logos - ${formatearPrecio(total)}`);
    const cuerpo = encodeURIComponent(resumen);

    // Crear mailto con tu correo como destino
    const url = `mailto:${CONFIG.EMAIL_DESTINO}?subject=${asunto}&body=${cuerpo}`;

    window.location.href = url;
    mostrarToast('Abriendo cliente de correo...', 'info');
}

// ====================
// DEPENDENCIAS LOGO 3
// ====================
function verificarDependenciasLogo3() {
    const logo3Checkbox = document.querySelector('input[name="logo3_incluir"]');
    const logo3Card = document.getElementById('logo3-card');
    const logo3Dependencia = document.getElementById('logo3-dependencia');

    if (!logo3Checkbox) return;

    // Verificar si algún logo requiere logo 3
    let requiereLogo3 = false;
    const logosQueRequieren = [];

    CONFIG.DEPENDENCIAS_LOGO3.forEach(logoKey => {
        const radioLogo3 = document.querySelector(`input[name="${logoKey}_abeja"][value="logo3"]`);
        const logoIncluido = document.querySelector(`input[name="${logoKey}_incluir"]`);

        if (radioLogo3 && radioLogo3.checked && logoIncluido && logoIncluido.checked) {
            requiereLogo3 = true;
            const logoNum = logoKey.replace('logo', '');
            logosQueRequieren.push(logoNum);
        }
    });

    // Actualizar visual y comportamiento
    if (requiereLogo3) {
        // Auto-seleccionar logo 3 si no está seleccionado
        if (!logo3Checkbox.checked) {
            logo3Checkbox.checked = true;
            mostrarToast(`Logo 3 (Abeja) seleccionado automáticamente - requerido por Logo ${logosQueRequieren.join(', ')}`, 'info', 4000);
            actualizarTotal();
        }

        // Mostrar aviso de dependencia
        if (logo3Dependencia) {
            logo3Dependencia.style.display = 'flex';
            logo3Dependencia.querySelector('.dependencia-texto').textContent =
                `Requerido por Logo ${logosQueRequieren.join(' y ')}`;
        }

        // Marcar card como dependencia activa
        if (logo3Card) {
            logo3Card.classList.add('tiene-dependencias');
        }
    } else {
        // Ocultar aviso si no hay dependencias
        if (logo3Dependencia) {
            logo3Dependencia.style.display = 'none';
        }
        if (logo3Card) {
            logo3Card.classList.remove('tiene-dependencias');
        }
    }
}

// Listener para radios de abeja que requieren logo 3
function inicializarDependenciasLogo3() {
    CONFIG.DEPENDENCIAS_LOGO3.forEach(logoKey => {
        const radiosAbeja = document.querySelectorAll(`input[name="${logoKey}_abeja"]`);
        radiosAbeja.forEach(radio => {
            radio.addEventListener('change', verificarDependenciasLogo3);
        });

        // También cuando se incluye/excluye el logo
        const checkboxIncluir = document.querySelector(`input[name="${logoKey}_incluir"]`);
        if (checkboxIncluir) {
            checkboxIncluir.addEventListener('change', verificarDependenciasLogo3);
        }
    });

    // Verificar al cargar
    verificarDependenciasLogo3();
}

// ====================
// EVENT LISTENERS
// ====================
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', actualizarTotal);
});

// Auto-guardar en cualquier cambio del formulario
if (formulario) {
    formulario.addEventListener('change', guardarFormulario);
    formulario.addEventListener('input', guardarFormulario);
}

// ====================
// INICIALIZACIÓN
// ====================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos guardados
    const cargado = cargarFormulario();
    if (cargado) {
        mostrarToast('Formulario restaurado', 'info', 2000);
    }

    actualizarTotal();

    // Inicializar sistema de dependencias del logo 3
    inicializarDependenciasLogo3();
});

// ====================
// TOGGLE AVANZADO
// ====================
function toggleAdvanced(element) {
    const content = element.nextElementSibling;
    const isOpen = content.classList.contains('open');

    if (isOpen) {
        content.classList.remove('open');
        element.classList.remove('open');
    } else {
        content.classList.add('open');
        element.classList.add('open');
    }
}

// Hacer funciones globales
window.copiarResumen = copiarResumen;
window.enviarCorreo = enviarCorreo;
window.limpiarFormulario = limpiarFormulario;
window.toggleAdvanced = toggleAdvanced;
window.guardarManual = guardarManual;
window.confirmarLimpiar = confirmarLimpiar;
window.cerrarModal = cerrarModal;
window.ejecutarLimpiar = ejecutarLimpiar;
window.mostrarResumen = mostrarResumen;
window.cerrarResumen = cerrarResumen;
window.confirmarYEnviar = confirmarYEnviar;

// ====================
// MODO OSCURO
// ====================

// Toggle tema
function toggleTheme() {
    document.body.classList.toggle('dark-mode');

    // Guardar preferencia
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);

    mostrarToast(isDark ? 'Modo oscuro activado' : 'Modo claro activado', 'info', 1500);
}

// Cargar preferencia guardada
function loadThemePreference() {
    const savedTheme = localStorage.getItem('darkMode');

    // Si hay preferencia guardada, usarla
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === null) {
        // Si no hay preferencia, detectar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        }
    }
}

// Inicializar tema
loadThemePreference();

// Hacer la función global
window.toggleTheme = toggleTheme;

// ====================
// ANIMACIONES AL SCROLL
// ====================

// Respetar preferencias de movimiento reducido
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    // Observador para animaciones al entrar en viewport
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar elementos para animar
    document.addEventListener('DOMContentLoaded', () => {
        // Elementos a animar cuando entran en viewport
        const animateElements = document.querySelectorAll('.logo-card, .form-logo-card, .entregable, .pago-card');
        animateElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `all 0.5s ease ${index * 0.05}s`;
            observer.observe(el);
        });
    });
}

// Clase para elementos visibles
const style = document.createElement('style');
style.textContent = `
    .animate-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;
document.head.appendChild(style);
