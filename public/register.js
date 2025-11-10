const AUTH_BASE_URL = '/api/auth'; 
const googleLoginUrl = `${AUTH_BASE_URL}/google-login`;
const registerUrl = `${AUTH_BASE_URL}/register`;

// Variables que se inicializan en DOMContentLoaded, pero deben ser globales para las funciones de error
const userInput = document.getElementById('user-input');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

const errorUser = document.getElementById('error-user');
const errorEmail = document.getElementById('error-email');
const errorPassword = document.getElementById('error-password');


// =========================================================
// 1. FUNCIONES DE UTILIDAD (Fuera de DOMContentLoaded)
// =========================================================

// Función auxiliar para limpiar todos los errores
function clearAllErrors() {
    if (errorUser) { errorUser.textContent = ''; errorUser.style.display = 'none'; }
    if (errorEmail) { errorEmail.textContent = ''; errorEmail.style.display = 'none'; }
    if (errorPassword) { errorPassword.textContent = ''; errorPassword.style.display = 'none'; }
    
    userInput?.classList.remove('input-error');
    emailInput?.classList.remove('input-error');
    passwordInput?.classList.remove('input-error');
}

// FUNCIÓN PARA MOSTRAR ERRORES DE CAMPO
function showFieldError(inputElement, errorElement, message) {
    clearAllErrors(); 
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement?.classList.add('input-error'); 
    }
    inputElement?.focus(); 
}

function showGeneralError(message) {
    console.error("ERROR GENERAL:", message);
}


// =========================================================
// 2. FUNCIÓN GLOBAL PARA GOOGLE SIGN-IN (ACCESIBLE PARA GSI)
// =========================================================
window.handleCredentialResponse = async (response) => {
    clearAllErrors();
    const id_token = response?.credential;
    if (!id_token) { showGeneralError('Error: token de Google vacío.'); return; }
    
    try {
        const res = await fetch(googleLoginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
            // ✅ ÉXITO: Redirección INMEDIATA
            localStorage.setItem('user_token', data.user_token);
            window.location.href = '/index.html';
        } else {
            showGeneralError(data.message || 'Error de autenticación con Google.');
        }
    } catch (error) {
        showGeneralError('Error de conexión con el servidor.');
    }
}

// =========================================================
// 3. CÓDIGO QUE ESPERA LA CARGA DEL DOM (Event Listeners)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const passwordToggleBtn = document.getElementById('password-toggle-btn');
    const eyeIconOpen = document.getElementById('eye-icon-open');
    const eyeIconClosed = document.getElementById('eye-icon-closed');

    if (passwordToggleBtn) {
        passwordToggleBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            eyeIconOpen.style.display = isPassword ? 'none' : 'block';
            eyeIconClosed.style.display = isPassword ? 'block' : 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllErrors();

            const usuario = userInput?.value.trim();
            const email = emailInput?.value.trim();
            const password = passwordInput?.value.trim();

            // 1. Validaciones de cliente
            if (!usuario) { showFieldError(userInput, errorUser, 'Por favor ingresa un nombre de usuario.'); return; }
            if (!email) { showFieldError(emailInput, errorEmail, 'Por favor ingresa tu correo electrónico.'); return; }
            if (!password) { showFieldError(passwordInput, errorPassword, 'Por favor ingresa una contraseña.'); return; }
            if (password.length < 6) { showFieldError(passwordInput, errorPassword, 'La contraseña debe tener al menos 6 caracteres.'); return; }
            
            try {
                const response = await fetch(registerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok && data.success) {
                    // ✅ ÉXITO: Redirige inmediatamente
                    localStorage.setItem('user_token', data.user_token);
                    window.location.href = '/index.html'; 
                } else {
                    // 2. ERROR DEL SERVIDOR
                    const message = data.message || 'Error desconocido en el registro.';
                    
                    if (message.toLowerCase().includes('usuario')) {
                        showFieldError(userInput, errorUser, message);
                    } else if (message.toLowerCase().includes('correo') || message.toLowerCase().includes('email')) {
                        showFieldError(emailInput, errorEmail, message);
                    } else if (message.toLowerCase().includes('contraseña') || message.toLowerCase().includes('password') || message.toLowerCase().includes('credenciales')) {
                        showFieldError(passwordInput, errorPassword, message);
                    } else {
                        showGeneralError(message);
                    }
                }
            } catch (error) {
                showGeneralError('Error de conexión con el servidor. Intente de nuevo.');
            }
        });
    }
});