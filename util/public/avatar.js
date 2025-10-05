/**
 * Avatar Utility Functions
 * Provides reusable functions for generating and managing user avatars with initials
 */

// Generate initials from first and last name
function generateInitials(firstname, lastname) {
    const firstInitial = firstname && firstname.trim() ? firstname.trim().charAt(0).toUpperCase() : '';
    const lastInitial = lastname && lastname.trim() ? lastname.trim().charAt(0).toUpperCase() : '';
    
    if (firstInitial && lastInitial) {
        return firstInitial + lastInitial;
    } else if (firstInitial) {
        return firstInitial;
    } else if (lastInitial) {
        return lastInitial;
    }
    return '?';
}

// Generate initials from email if no names are available
function generateInitialsFromEmail(email) {
    if (!email || !email.trim()) return '?';
    
    const emailParts = email.trim().split('@')[0];
    if (emailParts.length >= 2) {
        return emailParts.substring(0, 2).toUpperCase();
    } else if (emailParts.length === 1) {
        return emailParts.charAt(0).toUpperCase();
    }
    return '?';
}

// Create avatar element with initials
function createAvatarElement(user, size = 'medium', additionalClasses = '') {
    const avatar = document.createElement('div');
    avatar.className = `user-avatar ${size} ${additionalClasses}`.trim();
    
    let initials = '?';
    
    // Try to generate from first/last name first
    if (user.firstname || user.lastname) {
        initials = generateInitials(user.firstname, user.lastname);
    } else if (user.email) {
        // Fallback to email-based initials
        initials = generateInitialsFromEmail(user.email);
    }
    
    avatar.textContent = initials;
    return avatar;
}

// Update existing avatar element with user data
function updateAvatarElement(avatarElement, user) {
    if (!avatarElement) return;
    
    let initials = '?';
    
    // Try to generate from first/last name first
    if (user.firstname || user.lastname) {
        initials = generateInitials(user.firstname, user.lastname);
    } else if (user.email) {
        // Fallback to email-based initials
        initials = generateInitialsFromEmail(user.email);
    }
    
    avatarElement.textContent = initials;
}

// Get display name from user object
function getUserDisplayName(user) {
    const firstname = user.firstname && user.firstname.trim() ? user.firstname.trim() : '';
    const lastname = user.lastname && user.lastname.trim() ? user.lastname.trim() : '';
    
    if (firstname && lastname) {
        return `${firstname} ${lastname}`;
    } else if (firstname) {
        return firstname;
    } else if (lastname) {
        return lastname;
    } else if (user.email) {
        return user.email;
    }
    return 'Onbekende Gebruiker';
}

// Create avatar HTML string (for use in innerHTML)
function createAvatarHTML(user, size = 'medium', additionalClasses = '') {
    let initials = '?';
    
    // Try to generate from first/last name first
    if (user.firstname || user.lastname) {
        initials = generateInitials(user.firstname, user.lastname);
    } else if (user.email) {
        // Fallback to email-based initials
        initials = generateInitialsFromEmail(user.email);
    }
    
    return `<div class="user-avatar ${size} ${additionalClasses}".trim()>${initials}</div>`;
}