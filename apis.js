// ============================================
// API MODULE
// ============================================

const API = {
    // رابط API البوت - غيره حسب الهوست
    botApiUrl: 'https://verify.abukabaruh.kdns.fr/api',

    // ===== VERIFICATION =====
    async submitVerification(data) {
        try {
            const res = await fetch(`${this.botApiUrl}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) throw new Error('Server error');
            
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Cannot connect to verification server. Please try again later.' };
        }
    },

    // ===== CHECK STATUS =====
    async checkStatus(userId) {
        try {
            const res = await fetch(`${this.botApiUrl}/check/${userId}`);
            
            if (!res.ok) throw new Error('Server error');
            
            return await res.json();
        } catch (error) {
            console.error('Check error:', error);
            return { success: false, verified: false, status: 'error' };
        }
    },

    // ===== MINECRAFT LOOKUP =====
    async lookupMinecraft(username) {
        try {
            const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            
            if (!res.ok) return null;
            
            return await res.json();
        } catch (error) {
            console.error('Mojang API error:', error);
            return null;
        }
    },

    // ===== SKIN URL =====
    getSkinUrl(username) {
        return `https://minotar.net/armor/body/${username}/100.png`;
    },

    // ===== AVATAR URL =====
    getAvatarUrl(username) {
        return `https://minotar.net/avatar/${username}/128.png`;
    },

    // ===== NOTIFY BOT =====
    async notifyBot(data) {
        try {
            await fetch(`${this.botApiUrl}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Notify error:', error);
        }
    },

    // ===== GET LEADERBOARD =====
    async getLeaderboard() {
        try {
            const res = await fetch(`${this.botApiUrl}/leaderboard`);
            return await res.json();
        } catch (error) {
            return { success: false, data: [] };
        }
    },

    // ===== GET SETTINGS =====
    async getSettings() {
        try {
            const res = await fetch(`${this.botApiUrl}/settings`);
            return await res.json();
        } catch (error) {
            return { success: false, data: null };
        }
    }
};

export default API;
