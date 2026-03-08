// Precio por logo
const PRECIO_POR_LOGO = 13000;

// Elementos del DOM
const formulario = document.getElementById('formulario');
const logosCount = document.getElementById('logos-count');
const totalPrecio = document.getElementById('total-precio');

// Obtener todos los checkboxes de "incluir"
const checkboxes = document.querySelectorAll('input[name$="_incluir"]');

// Actualizar conteo y precio
function actualizarTotal() {
    const seleccionados = document.querySelectorAll('input[name$="_incluir"]:checked').length;
    const total = seleccionados * PRECIO_POR_LOGO;

    logosCount.textContent = seleccionados;
    totalPrecio.textContent = formatearPrecio(total);

    // Actualizar visual de las tarjetas
    checkboxes.forEach(checkbox => {
        const card = checkbox.closest('.form-logo-card');
        if (checkbox.checked) {
            card.style.opacity = '1';
            card.querySelector('.form-logo-body').style.display = 'block';
        } else {
            card.style.opacity = '0.6';
            card.querySelector('.form-logo-body').style.display = 'none';
        }
    });
}

// Formatear precio
function formatearPrecio(numero) {
    return '$' + numero.toLocaleString('es-CL');
}

// Copiar resumen al portapapeles
function copiarResumen() {
    const resumen = generarResumen();

    navigator.clipboard.writeText(resumen).then(() => {
        alert('Resumen copiado al portapapeles. Puedes pegarlo en WhatsApp, email, etc.');
    }).catch(err => {
        // Fallback para navegadores que no soportan clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = resumen;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Resumen copiado al portapapeles. Puedes pegarlo en WhatsApp, email, etc.');
    });
}

// Generar resumen de texto
function generarResumen() {
    const logos = [
        { num: 1, nombre: 'Cock Sparrer', campo: 'logo1' },
        { num: 2, nombre: 'Vasco da Gama', campo: 'logo2' },
        { num: 3, nombre: 'Abeja Lineal', campo: 'logo3' },
        { num: 4, nombre: 'ZTP Óvalo', campo: 'logo4' },
        { num: 5, nombre: 'ZINTROP Cerveza', campo: 'logo5' },
        { num: 6, nombre: 'ZINTROP Escudo', campo: 'logo6' },
        { num: 7, nombre: 'PZPN Águila', campo: 'logo7' },
        { num: 8, nombre: 'ZINTROP Fútbol v1', campo: 'logo8' },
        { num: 9, nombre: 'ZINTROP Fútbol v2', campo: 'logo9' }
    ];

    let resumen = '=== FORMULARIO DE VECTORIZACIÓN ===\n\n';

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
    const total = seleccionados * PRECIO_POR_LOGO;
    resumen += '\n─────────────────────\n';
    resumen += `TOTAL: ${seleccionados} logos = ${formatearPrecio(total)}\n`;
    resumen += '─────────────────────\n';

    return resumen;
}

// Event listeners
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', actualizarTotal);
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    actualizarTotal();
});

// Hacer la función global para el onclick
window.copiarResumen = copiarResumen;

// ====================
// MODO OSCURO
// ====================

// Toggle tema
function toggleTheme() {
    document.body.classList.toggle('dark-mode');

    // Guardar preferencia
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
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

// Clase para elementos visibles
const style = document.createElement('style');
style.textContent = `
    .animate-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);
