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
    remove(key) {
        localStorage.removeItem(`mc_${key}`);
    },
    clear() {
        Object.keys(localStorage)
            .filter(k => k.startsWith('mc_'))
            .forEach(k => localStorage.removeItem(k));
    }
};

// ============================================
// DISCORD AUTH
// ============================================
function loginWithDiscord() {
    const url = `https://discord.com/oauth2/authorize?client_id=${CONFIG.clientId}&redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}&response_type=token&scope=identify`;
    window.location.href = url;
}

function checkAuth() {
    const hash = window.location.hash;
    if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        if (token) {
            Store.set('token', token);
            window.location.hash = '';
            fetchDiscordUser(token);
        }
    } else {
        const savedToken = Store.get('token');
        if (savedToken) fetchDiscordUser(savedToken);
    }
}

async function fetchDiscordUser(token) {
    try {
        const res = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Invalid');
        const user = await res.json();
        Store.set('user', user);
        displayUser(user);
        showStep(2);
    } catch {
        Store.clear();
        showStep(1);
        showAlert('Login failed', 'error');
    }
}

// ============================================
// VERIFICATION
// ============================================
async function submitVerification() {
    const username = document.getElementById('mcUsername').value.trim();
    const user = Store.get('user');

    if (!username) return showAlert('Enter username', 'error');
    if (!user) return showAlert('Login first', 'error');
    if (username.length < 3 || username.length > 16) return showAlert('Invalid username length', 'error');

    showLoading();

    const mcData = await API.lookupMinecraft(username);
    if (!mcData) {
        hideLoading();
        return showAlert('Invalid Minecraft username', 'error');
    }

    const result = await API.submitVerification({
        discordId: user.id,
        discordUsername: `${user.username}#${user.discriminator}`,
        discordAvatar: user.avatar,
        minecraftUsername: mcData.name,
        minecraftUUID: mcData.id
    });

    hideLoading();

    if (result.success) {
        Store.set('status', 'pending');
        Store.set('minecraft', { username: mcData.name });
        showAlert('✅ Sent! Wait for approval.', 'success');
        setTimeout(() => showStep(3), 1500);
    } else {
        showAlert(result.error || 'Error', 'error');
    }
}

// ============================================
// UI
// ============================================
function showStep(step) {
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.add('hidden');
    document.getElementById(`step${step}`).classList.remove('hidden');
}

function displayUser(user) {
    const avatarUrl = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

    document.getElementById('userAvatar').src = avatarUrl;
    document.getElementById('userName').textContent = `${user.username}#${user.discriminator}`;
    
    const avatar3 = document.getElementById('userAvatar3');
    const name3 = document.getElementById('userName3');
    if (avatar3) avatar3.src = avatarUrl;
    if (name3) name3.textContent = `${user.username}#${user.discriminator}`;
}

function showAlert(msg, type = 'info') {
    const box = document.getElementById('alertBox');
    box.textContent = msg;
    box.className = `alert alert-${type}`;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 5000);
}

function showLoading() {
    const btn = document.getElementById('verifyBtn');
    btn.disabled = true;
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Verifying...';
}

function hideLoading() {
    const btn = document.getElementById('verifyBtn');
    btn.disabled = false;
    btn.innerHTML = btn.dataset.orig || '<i class="fas fa-check-circle"></i> Submit Verification';
}

function logout() {
    Store.clear();
    window.location.reload();
}

function joinDiscord() {
    window.open(CONFIG.discordInvite, '_blank');
}

// ============================================
// SKIN PREVIEW
// ============================================
document.getElementById('mcUsername').addEventListener('input', function(e) {
    const username = e.target.value.trim();
    const preview = document.getElementById('skinPreview');
    if (username.length >= 3) {
        preview.src = API.getSkinUrl(username);
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }
});

// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('serverInfo').textContent = `${CONFIG.serverName} - ${CONFIG.serverIp}`;
    
    const user = Store.get('user');
    const status = Store.get('status');

    if (user) {
        displayUser(user);
        if (status === 'pending') showStep(3);
        else showStep(2);
    } else {
        showStep(1);
        checkAuth();
    }
});

// Keyboard shortcut
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !document.getElementById('step2').classList.contains('hidden')) {
        submitVerification();
    }
});
