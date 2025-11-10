document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const userInput = document.getElementById('user-input');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    
    // Asignación de los nuevos elementos de error del HTML
    const errorUser = document.getElementById('error-user');
    const errorEmail = document.getElementById('error-email');
    const errorPassword = document.getElementById('error-password');

    // Los siguientes elementos ya no se usarán para errores de campo, 
    // pero se mantienen para errores de servidor generales si se implementan.
    // const messageBox = document.getElementById('custom_message_box'); 
    // const messageText = document.getElementById('custom_message_text'); 
    
    const passwordToggleBtn = document.getElementById('password-toggle-btn');
    const eyeIconOpen = document.getElementById('eye-icon-open');
    const eyeIconClosed = document.getElementById('eye-icon-closed');

    const BASE_URL = '/api/auth'; 
    const googleLoginUrl = `${BASE_URL}/google-login`;
    const registerUrl = `${BASE_URL}/register`;

    // FUNCIÓN PARA MOSTRAR ERRORES DE CAMPO
    function showFieldError(inputElement, errorElement, message) {
        clearAllErrors(); 
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            inputElement?.classList.add('input-error'); // Puedes usar una clase CSS para resaltar el input
        }
        inputElement?.focus(); 
    }
    
    // Función auxiliar para limpiar todos los errores
    function clearAllErrors() {
        // Limpia los mensajes
        if (errorUser) { errorUser.textContent = ''; errorUser.style.display = 'none'; }
        if (errorEmail) { errorEmail.textContent = ''; errorEmail.style.display = 'none'; }
        if (errorPassword) { errorPassword.textContent = ''; errorPassword.style.display = 'none'; }
        
        // Limpia las clases de error (si las implementaste)
        userInput?.classList.remove('input-error');
        emailInput?.classList.remove('input-error');
        passwordInput?.classList.remove('input-error');
    }

    // Errores generales (para conexión o API) se manejan internamente aquí
    function showGeneralError(message) {
        // Opción: Muestra en la consola o en un lugar discreto si es necesario.
        console.error("ERROR GENERAL:", message);
        // Si no quieres mostrarlo en pantalla, simplemente no hagas nada aquí.
    }

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

            // 1. Validaciones de cliente (las que el usuario puede cometer)
            if (!usuario) {
                showFieldError(userInput, errorUser, 'Por favor ingresa un nombre de usuario.');
                return;
            }
            if (!email) {
                showFieldError(emailInput, errorEmail, 'Por favor ingresa tu correo electrónico.');
                return;
            }
            if (!password) {
                showFieldError(passwordInput, errorPassword, 'Por favor ingresa una contraseña.');
                return;
            }
            if (password.length < 6) {
                showFieldError(passwordInput, errorPassword, 'La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            
            // Omitir mensaje de "Cargando"

            try {
                const response = await fetch(registerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok && data.success) {
                    // ✅ ÉXITO: Redirige inmediatamente a /index.html sin mensaje.
                    localStorage.setItem('user_token', data.user_token);
                    window.location.href = '/index.html'; 
                } else {
                    // 2. ERROR DEL SERVIDOR (ej: usuario/email ya existe)
                    const message = data.message || 'Error desconocido en el registro.';
                    
                    // Intenta asignar el error al campo más probable
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

    async function handleCredentialResponse(response) {
        clearAllErrors();
        const id_token = response?.credential;
        if (!id_token) { showGeneralError('Error: token de Google vacío.'); return; }
        
        // Omitir mensaje de "Cargando"

        try {
            const res = await fetch(googleLoginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                // ✅ ÉXITO: Redirige inmediatamente a /index.html sin mensaje.
                localStorage.setItem('user_token', data.user_token);
                window.location.href = '/index.html';
            } else {
                showGeneralError(data.message || 'Error de autenticación con Google.');
            }
        } catch (error) {
            showGeneralError('Error de conexión con el servidor.');
        }
    }
    window.handleCredentialResponse = handleCredentialResponse;
});