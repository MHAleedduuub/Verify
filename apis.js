// ============================================
// API MODULE
// ============================================

const API = {
    // رابط API البوت - غيره حسب الهوست
    botApiUrl: 'https://verify.abukabaruh.kdns.fr/api',

    // إرسال طلب تحقق
    async submitVerification(data) {
        try {
            const res = await fetch(`${this.botApiUrl}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Cannot connect to server' };
        }
    },

    // فحص حالة التحقق
    async checkStatus(userId) {
        try {
            const res = await fetch(`${this.botApiUrl}/check/${userId}`);
            return await res.json();
        } catch (error) {
            return { success: false, verified: false };
        }
    },

    // فحص مستخدم ماينكرافت
    async lookupMinecraft(username) {
        try {
            const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    },

    // جلب السكن
    getSkinUrl(username) {
        return `https://minotar.net/armor/body/${username}/100.png`;
    },

    // جلب الأفاتار
    getAvatarUrl(username) {
        return `https://minotar.net/avatar/${username}/128.png`;
    },

    // إرسال إشعار
    async notifyBot(data) {
        try {
            const res = await fetch(`${this.botApiUrl}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch {
            return { success: false };
        }
    }
};

export default API;
