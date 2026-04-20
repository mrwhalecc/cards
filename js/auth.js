/* ============================================================
   Cards项目 - 认证管理
   独立域名方案：cards.mrwhalex.com
   通过URL参数从Boss获取token
   ============================================================ */

const Auth = (() => {
    /**
     * 初始化：检查URL参数中的token
     */
    function init() {
        // 从URL参数获取token（Boss登录后跳转带过来的）
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            localStorage.setItem('boss_token', token);
            // 清除URL参数，避免泄露
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        }
        
        return false;
    }

    /**
     * 检查登录状态
     */
    function checkAuth() {
        const token = localStorage.getItem('boss_token');
        if (!token) {
            redirectToLogin();
            return false;
        }
        
        // 验证token是否过期
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                clearAuth();
                redirectToLogin();
                return false;
            }
        } catch {
            clearAuth();
            redirectToLogin();
            return false;
        }
        
        return true;
    }

    /**
     * 获取token
     */
    function getToken() {
        return localStorage.getItem('boss_token');
    }

    /**
     * 清除认证
     */
    function clearAuth() {
        localStorage.removeItem('boss_token');
    }

    /**
     * 跳转到Boss登录
     * 登录成功后Boss会带token跳转回来
     */
    function redirectToLogin() {
        const cardsUrl = encodeURIComponent('https://cards.mrwhalex.com');
        window.location.href = `https://boss.mrwhalex.com/login?redirect=${cardsUrl}`;
    }

    /**
     * 退出登录
     */
    function logout() {
        clearAuth();
        redirectToLogin();
    }

    return {
        init,
        checkAuth,
        getToken,
        clearAuth,
        redirectToLogin,
        logout
    };
})();
