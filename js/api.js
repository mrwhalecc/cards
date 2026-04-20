/* ============================================================
   Cards项目 - API调用层
   复用chatapi.mrwhalex.com后端
   ============================================================ */

const CardsAPI = (() => {
    const API_BASE = 'https://chatapi.mrwhalex.com';
    
    // 检查测试模式
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.get('test') === '1';
    
    /**
     * 获取认证Token
     */
    function getToken() {
        return localStorage.getItem('boss_token');
    }

    /**
     * 统一请求方法
     */
    async function request(path, options = {}) {
        const url = `${API_BASE}${path}`;
        const token = getToken();
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                ...options.headers
            }
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            
            // 处理认证失败（测试模式下不跳转）
            if (response.status === 401 && !isTestMode) {
                localStorage.removeItem('boss_token');
                window.location.href = '/login.html';
                return null;
            }

            // 解析响应
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    /**
     * Skill对话接口
     * 所有Skill都通过这个接口调用
     */
    async function chat(scenarioId, message, sessionId = null) {
        return request('/api/admin/boss/chat', {
            method: 'POST',
            body: {
                scenario_id: scenarioId,
                message: message,
                session_id: sessionId,
                source: 'cards'  // 标记来源为cards项目
            }
        });
    }

    /**
     * 获取Skill数据
     * 用于需要数据持久化的复杂Skill
     */
    async function getSkillData(skillId) {
        return request(`/api/cards/${skillId}/data`);
    }

    /**
     * 保存Skill数据
     */
    async function saveSkillData(skillId, data) {
        return request(`/api/cards/${skillId}/data`, {
            method: 'POST',
            body: data
        });
    }

    /**
     * 获取平台配置
     */
    async function getPlatformConfig() {
        return request('/api/admin/boss/platform-config');
    }

    /**
     * 获取当前用户信息
     */
    async function getCurrentUser() {
        return request('/api/admin/auth/me');
    }

    return {
        request,
        chat,
        getSkillData,
        saveSkillData,
        getPlatformConfig,
        getCurrentUser,
        getToken
    };
})();
