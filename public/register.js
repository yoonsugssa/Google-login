document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const userInput = document.getElementById('user-input');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const messageBox = document.getElementById('custom_message_box');
    const messageText = document.getElementById('custom_message_text');
    const passwordToggleBtn = document.getElementById('password-toggle-btn');
    const eyeIconOpen = document.getElementById('eye-icon-open');
    const eyeIconClosed = document.getElementById('eye-icon-closed');

    // 💡 CORRECCIÓN: Usamos ruta base relativa para mayor portabilidad (servidor/Render)
    const BASE_URL = '/api/auth';
    const googleLoginUrl = `${BASE_URL}/google-login`;
    const registerUrl = `${BASE_URL}/register`;

    function showMessageBox(status, message) {
        if (!messageBox || !messageText) return;

        messageBox.className = 'custom-message';
        messageText.textContent = message;

        switch (status) {
            case 'success':
                messageBox.style.backgroundColor = '#4CAF50'; 
                break;
            case 'error':
                messageBox.style.backgroundColor = '#F44336'; 
                break;
            case 'loading':
                // Aseguramos que se muestre el spinner si está definido en el CSS
                messageText.innerHTML = `<span class="spinner"></span> ${message}`;
                messageBox.style.backgroundColor = '#2196F3'; 
                break;
            default:
                 messageBox.style.backgroundColor = '#79648b'; // Color por defecto
        }

        // Mostrar el cuadro de mensaje
        messageBox.style.opacity = '1';
        messageBox.style.visibility = 'visible';

        if (status !== 'loading') {
            // Ocultar con transición después de 3 segundos
            setTimeout(() => { 
                messageBox.style.opacity = '0';
                messageBox.style.visibility = 'hidden'; 
            }, 3000);
        }
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

            const usuario = userInput?.value.trim();
            const email = emailInput?.value.trim();
            const password = passwordInput?.value.trim();

            if (!usuario || !email || !password) {
                showMessageBox('error', 'Por favor completa todos los campos.');
                return;
            }

            if (password.length < 6) {
                showMessageBox('error', 'La contraseña debe tener al menos 6 caracteres.');
                return;
            }

            showMessageBox('loading', 'Registrando usuario...');

            try {
                const response = await fetch(registerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok && data.success) {
                    localStorage.setItem('user_token', data.user_token);
                    showMessageBox('success', data.message || '¡Registro exitoso! Redirigiendo...');
                    // Redirección después de 1 segundo
                    setTimeout(() => (window.location.href = '/index.html'), 1000); 
                } else {
                    // Si falla, el mensaje se oculta después de 3 segundos
                    showMessageBox('error', data.message || 'Error en el registro.');
                }
            } catch (error) {
                showMessageBox('error', 'Error de conexión con el servidor.');
            }
        });
    }

    async function handleCredentialResponse(response) {
        const id_token = response?.credential;
        if (!id_token) { showMessageBox('error', 'Error: token de Google vacío.'); return; }
        
        showMessageBox('loading', 'Autenticando con Google...');

        try {
            const res = await fetch(googleLoginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token })
            });

            const data = await res.json().catch(() => ({}));

            if (response.ok && data.success) {
                    localStorage.setItem('user_token', data.user_token);
                    showMessageBox('success', data.message || '¡Registro exitoso! Redirigiendo...');
                    setTimeout(() => (window.location.href = '/index.html'), 1000); 
                } else {
                    showMessageBox('error', data.message || 'Error en el registro.');
                }
            } catch (error) {
                showMessageBox('error', 'Error de conexión con el servidor.');
            }
    }
    window.handleCredentialResponse = handleCredentialResponse;
});