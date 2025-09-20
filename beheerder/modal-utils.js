// Modal utility functions for beheerder pages

class ModalManager {
    constructor() {
        this.currentModal = null;
    }

    // Create a modal element
    createModal(id, title) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="ModalManager.instance.closeModal('${id}')">&times;</button>
                <h3>${title}</h3>
                <div class="modal-body"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(id);
            }
        });
        
        return modal;
    }

    // Show a modal
    showModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('show');
            this.currentModal = id;
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    // Close a modal
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('show');
            this.currentModal = null;
            document.body.style.overflow = 'auto'; // Restore scrolling
        }
    }

    // Close current modal (if any)
    closeCurrentModal() {
        if (this.currentModal) {
            this.closeModal(this.currentModal);
        }
    }

    // Create and show an edit modal for activities
    showEditActivityModal(activity = null) {
        const modalId = 'activity-edit-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = this.createModal(modalId, activity ? 'Activiteit Bewerken' : 'Nieuwe Activiteit');
        }

        const modalBody = modal.querySelector('.modal-body');
        const isEdit = activity !== null;
        
        modalBody.innerHTML = `
            <form class="modal-form" id="activity-form">
                <div class="modal-form-group">
                    <label for="activity-naam">Naam *</label>
                    <input type="text" id="activity-naam" required value="${isEdit ? this.escapeHtml(activity.naam) : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-locatie">Locatie *</label>
                    <input type="text" id="activity-locatie" required value="${isEdit ? this.escapeHtml(activity.locatie) : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-eten">Eten *</label>
                    <input type="text" id="activity-eten" required value="${isEdit ? this.escapeHtml(activity.eten) : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-omschrijving">Omschrijving *</label>
                    <textarea id="activity-omschrijving" required>${isEdit ? this.escapeHtml(activity.omschrijving) : ''}</textarea>
                </div>
                <div class="modal-form-group">
                    <label for="activity-begin">Begin datum/tijd *</label>
                    <input type="datetime-local" id="activity-begin" required value="${isEdit ? new Date(activity.begin).toISOString().slice(0, 16) : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-eind">Eind datum/tijd *</label>
                    <input type="datetime-local" id="activity-eind" required value="${isEdit ? new Date(activity.eind).toISOString().slice(0, 16) : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-kost">Kosten (€) *</label>
                    <input type="number" id="activity-kost" step="0.01" required value="${isEdit ? activity.kost : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-max">Maximum deelnemers *</label>
                    <input type="number" id="activity-max" required value="${isEdit ? activity.max : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-min">Minimum deelnemers *</label>
                    <input type="number" id="activity-min" required value="${isEdit ? activity.min : ''}">
                </div>
                <div class="modal-form-group">
                    <label for="activity-afbeelding">Afbeelding URL *</label>
                    <input type="url" id="activity-afbeelding" required value="${isEdit ? this.escapeHtml(activity.afbeelding) : ''}">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="ModalManager.instance.closeModal('${modalId}')">Annuleren</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Bijwerken' : 'Toevoegen'}</button>
                </div>
            </form>
        `;

        // Handle form submission
        const form = modal.querySelector('#activity-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleActivitySubmit(activity);
        });

        this.showModal(modalId);
    }

    // Create and show a view modal for activities
    showViewActivityModal(activity) {
        const modalId = 'activity-view-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = this.createModal(modalId, 'Activiteit Details');
        }

        const modalBody = modal.querySelector('.modal-body');
        const beginDate = new Date(activity.begin);
        const eindDate = new Date(activity.eind);
        
        modalBody.innerHTML = `
            <div class="modal-view-content">
                <div class="view-item">
                    <label>Naam:</label>
                    <div class="value">${this.escapeHtml(activity.naam)}</div>
                </div>
                <div class="view-item">
                    <label>Locatie:</label>
                    <div class="value">${this.escapeHtml(activity.locatie)}</div>
                </div>
                <div class="view-item">
                    <label>Omschrijving:</label>
                    <div class="value">${this.formatTextWithNewlines(activity.omschrijving)}</div>
                </div>
                <div class="view-item">
                    <label>Begin datum/tijd:</label>
                    <div class="value">${beginDate.toLocaleString()}</div>
                </div>
                <div class="view-item">
                    <label>Eind datum/tijd:</label>
                    <div class="value">${eindDate.toLocaleString()}</div>
                </div>
                <div class="view-item">
                    <label>Eten:</label>
                    <div class="value">${this.escapeHtml(activity.eten)}</div>
                </div>
                <div class="view-item">
                    <label>Kosten:</label>
                    <div class="value">€${activity.kost}</div>
                </div>
                <div class="view-item">
                    <label>Deelnemers:</label>
                    <div class="value">${activity.min} - ${activity.max}</div>
                </div>
                <div class="view-item">
                    <label>Afbeelding:</label>
                    <div class="value"><a href="${this.escapeHtml(activity.afbeelding)}" target="_blank" class="btn btn-info btn-small">Bekijk Afbeelding</a></div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="ModalManager.instance.closeModal('${modalId}')">Sluiten</button>
                    <button type="button" class="btn btn-primary" onclick="ModalManager.instance.closeModal('${modalId}'); ModalManager.instance.showEditActivityModal(${JSON.stringify(activity).replace(/"/g, '&quot;')})">Bewerken</button>
                </div>
            </div>
        `;

        this.showModal(modalId);
    }

    // Create and show an edit modal for users
    showEditUserModal(user = null) {
        const modalId = 'user-edit-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = this.createModal(modalId, user ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker');
        }

        const modalBody = modal.querySelector('.modal-body');
        const isEdit = user !== null;
        
        modalBody.innerHTML = `
            <form class="modal-form" id="user-form">
                <div class="name-fields" style="display: flex; gap: 15px; width: 100%;">
                    <div class="modal-form-group" style="flex: 1;">
                        <label for="user-firstname">Voornaam *</label>
                        <input type="text" id="user-firstname" required value="${isEdit && user.firstname ? this.escapeHtml(user.firstname) : ''}">
                    </div>
                    <div class="modal-form-group" style="flex: 1;">
                        <label for="user-lastname">Achternaam *</label>
                        <input type="text" id="user-lastname" required value="${isEdit && user.lastname ? this.escapeHtml(user.lastname) : ''}">
                    </div>
                </div>
                <div class="modal-form-group">
                    <label for="user-email">Email *</label>
                    <input type="email" id="user-email" required value="${isEdit ? this.escapeHtml(user.email) : ''}">
                </div>
                ${isEdit ? `
                <div class="modal-form-group">
                    <label for="user-password">Nieuw Wachtwoord (laat leeg om niet te wijzigen)</label>
                    <input type="password" id="user-password" placeholder="Laat leeg om ongewijzigd te laten">
                </div>
                ` : ''}
                <div class="modal-form-group">
                    <label for="user-admin">Rol *</label>
                    <select id="user-admin" required>
                        <option value="2" ${isEdit && !user.admin ? 'selected' : ''}>Gebruiker</option>
                        <option value="1" ${isEdit && user.admin ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="ModalManager.instance.closeModal('${modalId}')">Annuleren</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Bijwerken' : 'Toevoegen'}</button>
                </div>
            </form>
        `;

        // Handle form submission
        const form = modal.querySelector('#user-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUserSubmit(user);
        });

        this.showModal(modalId);
    }

    // Create and show a view modal for users
    showViewUserModal(user) {
        const modalId = 'user-view-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = this.createModal(modalId, 'Gebruiker Details');
        }

        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="modal-view-content">
                <div class="view-item">
                    <label>ID:</label>
                    <div class="value">${user.id}</div>
                </div>
                <div class="view-item">
                    <label>Email:</label>
                    <div class="value">${this.escapeHtml(user.email)}</div>
                </div>
                <div class="view-item">
                    <label>Rol:</label>
                    <div class="value">${user.admin ? 'Admin' : 'Gebruiker'}</div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="ModalManager.instance.closeModal('${modalId}')">Sluiten</button>
                    <button type="button" class="btn btn-primary" onclick="ModalManager.instance.closeModal('${modalId}'); ModalManager.instance.showEditUserModal(${JSON.stringify(user).replace(/"/g, '&quot;')})">Bewerken</button>
                </div>
            </div>
        `;

        this.showModal(modalId);
    }

    // Handle activity form submission
    async handleActivitySubmit(existingActivity) {
        const formData = {
            naam: document.getElementById('activity-naam').value,
            locatie: document.getElementById('activity-locatie').value,
            eten: document.getElementById('activity-eten').value,
            omschrijving: document.getElementById('activity-omschrijving').value,
            begin: document.getElementById('activity-begin').value,
            eind: document.getElementById('activity-eind').value,
            kost: parseFloat(document.getElementById('activity-kost').value),
            max: parseInt(document.getElementById('activity-max').value),
            min: parseInt(document.getElementById('activity-min').value),
            afbeelding: document.getElementById('activity-afbeelding').value
        };

        // Validate required fields
        for (const [key, value] of Object.entries(formData)) {
            if (!value && value !== 0) {
                alert(`Vul het veld "${key}" in!`);
                return;
            }
        }

        const isEdit = existingActivity !== null;
        if (isEdit) {
            formData.id = existingActivity.id;
        }

        try {
            const response = await fetch('/api/activiteit', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(isEdit ? 'Activiteit bijgewerkt!' : 'Activiteit toegevoegd!');
                this.closeModal('activity-edit-modal');
                
                // Reload data if the function exists
                if (typeof loadActiviteiten === 'function') {
                    loadActiviteiten();
                } else if (typeof loadDashboard === 'function') {
                    loadDashboard();
                }
            } else {
                const error = await response.text();
                alert('Error: ' + error);
            }
        } catch (error) {
            console.error('Error saving activity:', error);
            alert('Error saving activity');
        }
    }

    // Handle user form submission
    async handleUserSubmit(existingUser) {
        const firstname = document.getElementById('user-firstname').value;
        const lastname = document.getElementById('user-lastname').value;
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password') ? document.getElementById('user-password').value : null;
        const role = parseInt(document.getElementById('user-admin').value);

        if (!firstname || !lastname) {
            alert('Voornaam en achternaam zijn verplicht!');
            return;
        }

        if (!email) {
            alert('Email is verplicht!');
            return;
        }

        const isEdit = existingUser !== null;

        const formData = { email, role, firstname, lastname };
        if (isEdit) {
            formData.id = existingUser.id;
            if (password.trim() !== '') {
                formData.password = password;
            } else {
                // For edits without password change, we need to handle this in API
                // For now, require password for all updates
                alert('Vul een nieuw wachtwoord in om de gebruiker bij te werken.');
                return;
            }
        }

        try {
            const response = await fetch('/api/gebruiker', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(isEdit ? 'Gebruiker bijgewerkt!' : 'Gebruiker toegevoegd!');
                this.closeModal('user-edit-modal');
                
                // Reload data if the function exists
                if (typeof loadUsers === 'function') {
                    loadUsers();
                } else if (typeof loadDashboard === 'function') {
                    loadDashboard();
                }
            } else {
                const error = await response.text();
                alert('Error: ' + error);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user');
        }
    }

    // Utility functions
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTextWithNewlines(text) {
        if (!text) return '';
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    // Confirmation dialog for delete actions
    async confirmDelete(message, onConfirm) {
        if (confirm(message)) {
            await onConfirm();
        }
    }
}

// Create global instance
ModalManager.instance = new ModalManager();

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        ModalManager.instance.closeCurrentModal();
    }
});
