// ====================
// CONFIGURACIÓN
// ====================
const CONFIG = {
    PRECIO_POR_LOGO: 13000,
    LOCALE: 'es-CL',
    STORAGE_KEY: 'propuesta_formulario',
    WHATSAPP_NUMERO: '56987438693', // Sergio Seguel
    AUTO_SAVE_DELAY: 2000
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
    const seleccionados = document.querySelectorAll('input[name$="_incluir"]:checked').length;
    const total = seleccionados * CONFIG.PRECIO_POR_LOGO;

    if (logosCount) logosCount.textContent = seleccionados;
    if (totalPrecio) totalPrecio.textContent = formatearPrecio(total);

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
// ENVIAR WHATSAPP
// ====================
function enviarWhatsApp() {
    if (!validarFormulario()) return;

    const resumen = generarResumen();
    const mensaje = encodeURIComponent(resumen);
    const url = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${mensaje}`;

    window.open(url, '_blank');
    mostrarToast('Abriendo WhatsApp...', 'info');
}

// ====================
// GENERAR RESUMEN
// ====================
function generarResumen() {
    const logos = [];
    document.querySelectorAll('.form-logo-card').forEach((card, idx) => {
        const nameEl = card.querySelector('.form-logo-name');
        const numEl = card.querySelector('.form-logo-num');
        if (nameEl && numEl) {
            logos.push({
                num: parseInt(numEl.textContent) || idx + 1,
                nombre: nameEl.textContent.trim(),
                campo: `logo${idx + 1}`
            });
        }
    });

    let resumen = '=== PROPUESTA DE VECTORIZACIÓN ===\n';
    resumen += `Fecha: ${new Date().toLocaleDateString('es-CL')}\n\n`;

    // Logos seleccionados
    resumen += 'LOGOS SELECCIONADOS:\n';
    resumen += '─────────────────────\n';

    let seleccionados = 0;

    logos.forEach(logo => {
        const incluir = document.querySelector(`input[name="${logo.campo}_incluir"]`);
        if (incluir && incluir.checked) {
            seleccionados++;
            resumen += `\n${logo.num}. ${logo.nombre}\n`;

            // Obtener opciones seleccionadas
            const radios = document.querySelectorAll(`input[name^="${logo.campo}_"]:checked`);
            radios.forEach(radio => {
                if (radio.name !== `${logo.campo}_incluir`) {
                    const label = radio.closest('label');
                    if (label) {
                        resumen += `   • ${label.textContent.trim()}\n`;
                    }
                }
            });

            // Notas
            const notas = document.querySelector(`textarea[name="${logo.campo}_notas"]`);
            if (notas && notas.value.trim()) {
                resumen += `   Notas: ${notas.value.trim()}\n`;
            }
        }
    });

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
    const total = seleccionados * CONFIG.PRECIO_POR_LOGO;
    resumen += '\n─────────────────────\n';
    resumen += `TOTAL: ${seleccionados} logos = ${formatearPrecio(total)}\n`;
    resumen += '─────────────────────\n';

    resumen += '\nPropuesta aceptada: Sí\n';

    return resumen;
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
window.enviarWhatsApp = enviarWhatsApp;
window.limpiarFormulario = limpiarFormulario;
window.toggleAdvanced = toggleAdvanced;
window.guardarManual = guardarManual;
window.confirmarLimpiar = confirmarLimpiar;
window.cerrarModal = cerrarModal;
window.ejecutarLimpiar = ejecutarLimpiar;

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
