const AUTH_BASE_URL = '/api/auth'; 

const passwordInput = document.getElementById('password-input');
const toggleButton = document.getElementById('password-toggle-btn');
const openEye = document.getElementById('eye-icon-open');
const closedEye = document.getElementById('eye-icon-closed');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');

// Elementos de error (deben estar en tu HTML: <p class="error-text" id="error-email">)
const errorEmail = document.getElementById('error-email');
const errorPassword = document.getElementById('error-password');


// Función para limpiar todos los errores
function clearAllErrors() {
    if (errorEmail) { errorEmail.textContent = ''; errorEmail.style.display = 'none'; }
    if (errorPassword) { errorPassword.textContent = ''; errorPassword.style.display = 'none'; }
    emailInput?.classList.remove('input-error');
    passwordInput?.classList.remove('input-error');
}

// Función para mostrar errores de campo
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
    // Para login, un error general se muestra en el campo de email/usuario
    showFieldError(emailInput, errorEmail, message);
}


// =========================================================
// 🚨 FUNCIÓN GLOBAL PARA GOOGLE SIGN-IN (GSI) 🚨
// Debe estar global para que el script de Google la encuentre.
// =========================================================
window.handleCredentialResponse = async (response) => {
    clearAllErrors();
    const id_token = response?.credential;
    if (!id_token) { 
        showGeneralError('Error al obtener credencial de Google.'); 
        return; 
    }

    try {
        const apiResponse = await fetch(`${AUTH_BASE_URL}/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token })
        });

        const data = await apiResponse.json().catch(() => ({}));

        if (apiResponse.ok && data.success) {
            if (data.user_token) localStorage.setItem('user_token', data.user_token);
            window.location.href = '/index.html';
        } else {
            showGeneralError(data.message || 'Error de autenticación con Google.');
        }
    } catch (error) {
        showGeneralError('Error de conexión con el servidor.');
    }
};

document.addEventListener('DOMContentLoaded', () => {

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            openEye.style.display = isPassword ? 'none' : 'block';
            closedEye.style.display = isPassword ? 'block' : 'none';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearAllErrors();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Validaciones de cliente
            if (!email) { showFieldError(emailInput, errorEmail, 'El usuario o correo es obligatorio.'); return; }
            if (!password) { showFieldError(passwordInput, errorPassword, 'La contraseña es obligatoria.'); return; }

            try {
                const response = await fetch(`${AUTH_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioOrEmail: email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    if (data.user_token) localStorage.setItem('user_token', data.user_token);
                    window.location.href = '/index.html'; 
                } else {
                    const message = data.message || 'Credenciales incorrectas.';
                    
                    if (message.toLowerCase().includes('password') || message.toLowerCase().includes('contraseña')) {
                        showFieldError(passwordInput, errorPassword, message);
                    } else {
                        showFieldError(emailInput, errorEmail, message);
                    }
                }
            } catch (error) {
                showGeneralError('Error de conexión con el servidor. Intente de nuevo.');
            }
        });
    }
});