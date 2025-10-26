import { Notification, NotifType } from '/util/notif.js';

const token = window.sessionStorage.getItem('JWT');
const form = document.getElementById('profileForm');
const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const currentPasswordInput = document.getElementById('currentPassword');
const saveButton = document.getElementById('saveButton');
const statusText = document.getElementById('formStatus');

let currentEmail = '';
let submitting = false;
let userId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!form) {
        return;
    }

    if (!token) {
        redirectToLogin();
        return;
    }

    initialize().catch((error) => {
        console.error('Error tijdens initialisatie profielpagina:', error);
        showStatus('Kon profielgegevens niet laden. Probeer het later opnieuw.', 'error');
    });
});

function redirectToLogin() {
    window.sessionStorage.removeItem('JWT');
    window.location.href = '/login';
}

async function initialize() {
    const verifyResponse = await fetch(`/api/verify?token=${encodeURIComponent(token)}`);
    const verifyData = await verifyResponse.json();

    if (!verifyData || !verifyData.id) {
        redirectToLogin();
        return;
    }

    userId = verifyData.id;
    await loadUserDetails();
    attachListeners();
}

async function loadUserDetails() {
    const response = await fetch(`/api/gebruiker?id=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`);
    if (!response.ok) {
        throw new Error(`Kon gebruiker niet laden: ${response.status}`);
    }
    const data = await response.json();
    currentEmail = data.email || '';
    emailInput.value = currentEmail;
}

function attachListeners() {
    form.addEventListener('submit', handleSubmit);
    [newPasswordInput, confirmPasswordInput].forEach((input) => {
        input.addEventListener('input', clearStatus);
    });
    emailInput.addEventListener('input', clearStatus);
    currentPasswordInput.addEventListener('input', clearStatus);
}

function clearStatus() {
    showStatus('', 'info');
}

function showStatus(message, type) {
    if (!statusText) {
        return;
    }

    statusText.textContent = message || '';
    statusText.dataset.type = type || 'info';

    switch (type) {
        case 'success':
            statusText.style.color = '#16a34a';
            break;
        case 'error':
            statusText.style.color = '#dc2626';
            break;
        default:
            statusText.style.color = '#5c6370';
            break;
    }
}

function showNotification(message, type) {
    try {
        const notificationType = type || NotifType.INFO;
        new Notification(message, notificationType).show();
    } catch (error) {
        console.warn('Kon melding niet tonen:', error);
        showStatus(message, type === NotifType.ERROR ? 'error' : 'success');
    }
}

function setSubmitting(state) {
    submitting = state;
    if (saveButton) {
        saveButton.disabled = state;
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
        return;
    }

    const emailValue = (emailInput.value || '').trim();
    const newPasswordValue = newPasswordInput.value || '';
    const confirmPasswordValue = confirmPasswordInput.value || '';
    const currentPasswordValue = currentPasswordInput.value || '';

    if (!currentPasswordValue) {
        showStatus('Voer uw huidige wachtwoord in om wijzigingen op te slaan.', 'error');
        return;
    }

    if (newPasswordValue && newPasswordValue !== confirmPasswordValue) {
        showStatus('Nieuw wachtwoord en bevestiging komen niet overeen.', 'error');
        return;
    }

    if (emailInput && !emailInput.checkValidity()) {
        showStatus('Voer een geldig e-mailadres in.', 'error');
        return;
    }

    const payload = { currentPassword: currentPasswordValue };
    let hasChanges = false;

    if (emailValue && emailValue !== currentEmail) {
        payload.email = emailValue;
        hasChanges = true;
    }

    if (newPasswordValue) {
        payload.newPassword = newPasswordValue;
        hasChanges = true;
    }

    if (!hasChanges) {
        showStatus('Geen wijzigingen gevonden om op te slaan.', 'info');
        return;
    }

    try {
        setSubmitting(true);
        showStatus('Wijzigingen worden opgeslagen…', 'info');

        const response = await fetch(`/api/gebruiker/profile?token=${encodeURIComponent(token)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Kon profiel niet bijwerken');
        }

        const result = await response.json().catch(() => ({ success: true }));
        currentEmail = payload.email || currentEmail;
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        currentPasswordInput.value = '';

        showStatus('Profiel succesvol bijgewerkt.', 'success');

        if (result && result.passwordChanged) {
            showNotification('Uw wachtwoord is bijgewerkt.', NotifType.SUCCESS);
        } else if (result && result.emailChanged) {
            showNotification('Uw e-mailadres is bijgewerkt.', NotifType.SUCCESS);
        } else {
            showNotification('Profiel opgeslagen.', NotifType.SUCCESS);
        }
    } catch (error) {
        console.error('Error tijdens opslaan profiel:', error);
        showStatus(error.message || 'Kon profiel niet bijwerken.', 'error');
        showNotification(error.message || 'Opslaan mislukt.', NotifType.ERROR);
    } finally {
        setSubmitting(false);
    }
}
