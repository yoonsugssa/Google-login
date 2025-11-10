// login.js
document.addEventListener('DOMContentLoaded', () => {
    const AUTH_BASE_URL = 'http://localhost:3000/api/auth';
    
    const passwordInput = document.getElementById('password-input');
    const toggleButton = document.getElementById('password-toggle-btn');
    const openEye = document.getElementById('eye-icon-open');
    const closedEye = document.getElementById('eye-icon-closed');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const messageDiv = document.getElementById('custom_message_text');
    const messageBox = document.getElementById('custom_message_box');

    function showMessage(text, color, timeout = 3000) {
        if (!messageDiv || !messageBox) return;
        messageDiv.textContent = text;
        messageBox.style.backgroundColor = color;
        messageBox.style.display = 'block';

        if (timeout > 0) {
            setTimeout(() => { messageBox.style.display = 'none'; }, timeout);
        }
    }

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
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            if (!email || !password) { showMessage('Por favor completa todos los campos.', '#F44336'); return; }

            showMessage('Iniciando sesión...', '#2196F3', 0);

            try {
                const response = await fetch(`${AUTH_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioOrEmail: email, password })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    showMessage(data.message || 'Redirigiendo...', '#4CAF50');
                    if (data.user_token) localStorage.setItem('user_token', data.user_token);
                    // REDIRECCIÓN CORREGIDA
                    setTimeout(() => (window.location.href = '/index.html'), 1000); 
                } else {
                    showMessage(`Error: ${data.message || 'Error de credenciales.'}`, '#F44336');
                }
            } catch (error) {
                showMessage('Error de conexión con el servidor. Intente de nuevo.', '#F44336');
            }
        });
    }

    window.handleCredentialResponse = async (response) => {
        const id_token = response?.credential;
        if (!id_token) { showMessage('Error al obtener credencial de Google.', '#F44336'); return; }

        showMessage('Procesando con Google...', '#2196F3', 0);

        try {
            const apiResponse = await fetch(`${AUTH_BASE_URL}/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token })
            });

            const data = await apiResponse.json().catch(() => ({}));

            if (apiResponse.ok && data.success) {
                showMessage(`Google Login exitoso. ${data.message || 'Redirigiendo...'}`, '#4CAF50');
                if (data.user_token) localStorage.setItem('user_token', data.user_token);
                setTimeout(() => (window.location.href = '/index.html'), 1000);
            } else {
                showMessage(`Error de Google Login: ${data.message || 'Error del servidor.'}`, '#F44336');
            }
        } catch (error) {
            showMessage('Error de conexión con el servidor.', '#F44336');
        }
    };
});