import API from './apis.js';

// ============================================
// CONFIG
// ============================================
const CONFIG = {
    clientId: '1348975754590818314',
    redirectUri: 'https://verify.abukabaruh.kdns.fr',
    discordInvite: 'https://discord.gg/yFNuMPY3sw',
    serverIp: 'soon',
    serverName: 'Kabaruh'
};

// ============================================
// LOCAL STORAGE
// ============================================
const Store = {
    set(key, value) {
        localStorage.setItem(`mc_${key}`, JSON.stringify(value));
    },
    get(key) {
        try {
            return JSON.parse(localStorage.getItem(`mc_${key}`));
        } catch {
            return null;
        }
    },
    clear() {
        Object.keys(localStorage)
            .filter(k => k.startsWith('mc_'))
            .forEach(k => localStorage.removeItem(k));
    }
};

// ============================================
// DISCORD OAUTH2
// ============================================
function loginWithDiscord() {
    const params = new URLSearchParams({
        client_id: CONFIG.clientId,
        redirect_uri: CONFIG.redirectUri,
        response_type: 'token',
        scope: 'identify'
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    window.location.href = authUrl;
}

function handleAuthCallback() {
    const hash = window.location.hash;
    
    if (!hash) return false;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
        console.error('OAuth error:', error);
        showAlert('Authorization failed', 'error');
        window.location.hash = '';
        return false;
    }

    if (accessToken) {
        Store.set('token', accessToken);
        window.location.hash = '';
        fetchDiscordUser(accessToken);
        return true;
    }

    return false;
}

async function fetchDiscordUser(token) {
    try {
        const res = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch user');

        const user = await res.json();
        Store.set('user', user);
        displayUser(user);
        showStep(2);
        showAlert('✅ Logged in successfully!', 'success');
    } catch (error) {
        console.error('User fetch error:', error);
        Store.clear();
        showStep(1);
        showAlert('Login failed. Please try again.', 'error');
    }
}

// ============================================
// VERIFICATION
// ============================================
async function submitVerification() {
    const username = document.getElementById('mcUsername')?.value.trim();
    const user = Store.get('user');

    if (!username) return showAlert('Enter Minecraft username', 'error');
    if (!user) return showAlert('Login first', 'error');
    if (username.length < 3 || username.length > 16) return showAlert('Username must be 3-16 characters', 'error');

    showLoading();

    const mcData = await API.lookupMinecraft(username);
    if (!mcData) {
        hideLoading();
        return showAlert('Invalid Minecraft username', 'error');
    }

    const result = await API.submitVerification({
        discordId: user.id,
        discordUsername: user.global_name || user.username,
        discordAvatar: user.avatar,
        minecraftUsername: mcData.name,
        minecraftUUID: mcData.id
    });

    hideLoading();

    if (result.success) {
        Store.set('status', 'pending');
        Store.set('minecraft', { username: mcData.name });
        showAlert('✅ Request sent! Wait for admin approval.', 'success');
        setTimeout(() => showStep(3), 1500);
    } else {
        showAlert(result.error || 'Error submitting verification', 'error');
    }
}

// ============================================
// UI
// ============================================
function showStep(step) {
    document.getElementById('step1')?.classList.add('hidden');
    document.getElementById('step2')?.classList.add('hidden');
    document.getElementById('step3')?.classList.add('hidden');
    document.getElementById(`step${step}`)?.classList.remove('hidden');
}

function displayUser(user) {
    const avatarUrl = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

    const username = user.global_name || user.username || 'Unknown';

    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userName');
    const avatar3 = document.getElementById('userAvatar3');
    const name3 = document.getElementById('userName3');

    if (avatar) avatar.src = avatarUrl;
    if (name) name.textContent = username;
    if (avatar3) avatar3.src = avatarUrl;
    if (name3) name3.textContent = username;
}

function showAlert(msg, type = 'info') {
    const box = document.getElementById('alertBox');
    if (!box) return;
    
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    box.innerHTML = `<span>${icons[type] || ''}</span> ${msg}`;
    box.className = `alert alert-${type}`;
    box.classList.remove('hidden');
    
    setTimeout(() => box.classList.add('hidden'), 5000);
}

function showLoading() {
    const btn = document.getElementById('verifyBtn');
    if (btn) {
        btn.disabled = true;
        btn.dataset.orig = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Verifying...';
    }
}

function hideLoading() {
    const btn = document.getElementById('verifyBtn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.orig || '<i class="fas fa-check-circle"></i> Submit Verification';
    }
}

function logout() {
    Store.clear();
    window.location.href = '/';
}

function joinDiscord() {
    window.open(CONFIG.discordInvite, '_blank');
}

// ============================================
// SKIN PREVIEW
// ============================================
function setupSkinPreview() {
    const mcInput = document.getElementById('mcUsername');
    if (!mcInput) return;

    mcInput.addEventListener('input', function(e) {
        const username = e.target.value.trim();
        const preview = document.getElementById('skinPreview');
        const container = document.getElementById('skinPreviewContainer');
        
        if (username.length >= 3) {
            if (preview) preview.src = API.getSkinUrl(username);
            if (container) container.classList.remove('hidden');
        } else {
            if (container) container.classList.add('hidden');
        }
    });
}

// ============================================
// INIT
// ============================================
function init() {
    // Set server info
    const serverInfo = document.getElementById('serverInfo');
    if (serverInfo) serverInfo.textContent = `${CONFIG.serverName} - ${CONFIG.serverIp}`;

    // Setup skin preview
    setupSkinPreview();

    // Handle OAuth callback FIRST
    if (window.location.hash && window.location.hash.includes('access_token')) {
        handleAuthCallback();
        return;
    }

    // Check session
    const user = Store.get('user');
    const status = Store.get('status');

    if (user) {
        displayUser(user);
        if (status === 'pending') showStep(3);
        else showStep(2);
    } else {
        showStep(1);
    }
}

// ============================================
// START
// ============================================
window.addEventListener('DOMContentLoaded', init);

// Keyboard shortcut
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !document.getElementById('step2')?.classList.contains('hidden')) {
        submitVerification();
    }
});
