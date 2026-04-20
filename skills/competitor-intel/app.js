/* ============================================================
   竞品情报员 - Skill逻辑
   调用chatapi后端: /api/cards/competitor-intel/*
   ============================================================ */

const CompetitorIntel = (() => {
    // API基础路径
    const API_BASE = '/api/admin/cards/competitor-intel';
    
    // 状态
    let monitors = [];
    let alerts = [];
    let isLoading = false;

    /**
     * 初始化
     */
    function init() {
        // 检查登录状态 - 未登录跳转到boss登录页
        if (!CardsAPI.getToken()) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `https://boss.mrwhalex.com/login.html?redirect=${currentUrl}`;
            return;
        }

        // 绑定事件
        document.getElementById('addBtn').addEventListener('click', showModal);
        document.getElementById('refreshBtn').addEventListener('click', refreshAll);
        document.getElementById('addModal').addEventListener('click', (e) => {
            if (e.target.id === 'addModal') closeModal();
        });

        // 加载数据
        loadData();

        // 定时刷新（每5分钟）
        setInterval(refreshAll, 5 * 60 * 1000);
    }

    /**
     * 加载所有数据
     */
    async function loadData() {
        try {
            await Promise.all([
                loadStats(),
                loadMonitors(),
                loadAlerts()
            ]);
        } catch (error) {
            console.error('加载数据失败:', error);
            UI.showToast('加载数据失败', 'error');
        }
    }

    /**
     * 加载统计
     */
    async function loadStats() {
        try {
            const result = await CardsAPI.request(`${API_BASE}/stats`);
            if (result.success) {
                document.getElementById('totalMonitors').textContent = result.data.totalMonitors;
                document.getElementById('activeMonitors').textContent = result.data.activeMonitors;
                document.getElementById('unreadAlerts').textContent = result.data.unreadAlerts;
                document.getElementById('totalAlerts').textContent = result.data.totalAlerts;
            }
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    }

    /**
     * 加载监控列表
     */
    async function loadMonitors() {
        try {
            const result = await CardsAPI.request(`${API_BASE}/monitors`);
            if (result.success) {
                monitors = result.data;
                renderMonitors();
                
                // 如果有多于1个监控，显示对比矩阵
                if (monitors.length > 1) {
                    loadMatrix();
                }
            }
        } catch (error) {
            console.error('加载监控列表失败:', error);
            renderEmptyMonitors();
        }
    }

    /**
     * 渲染监控列表
     */
    function renderMonitors() {
        const list = document.getElementById('monitorList');
        const count = document.getElementById('monitorCount');
        
        count.textContent = monitors.length;

        if (monitors.length === 0) {
            renderEmptyMonitors();
            return;
        }

        list.innerHTML = monitors.map(m => `
            <div class="monitor-card ${m.status === 'active' ? '' : 'paused'}" data-id="${m.id}">
                <div class="monitor-main">
                    <div class="monitor-info">
                        <h3 class="monitor-name">${m.name}</h3>
                        ${m.url ? `<a href="${m.url}" target="_blank" class="monitor-url">${m.url}</a>` : ''}
                    </div>
                    <div class="monitor-status">
                        <span class="status-dot ${m.status}"></span>
                        <span class="status-text">${m.status === 'active' ? '监控中' : '已暂停'}</span>
                    </div>
                </div>
                
                <div class="monitor-dimensions">
                    ${m.dimensions.map(d => `<span class="dim-tag">${getDimensionLabel(d)}</span>`).join('')}
                </div>
                
                <div class="monitor-footer">
                    <span class="last-check">上次检查: ${m.lastCheckAt ? Utils.formatDate(m.lastCheckAt) : '未检查'}</span>
                    <div class="monitor-actions">
                        <button class="action-btn" onclick="CompetitorIntel.checkMonitor('${m.id}')">检查</button>
                        <button class="action-btn danger" onclick="CompetitorIntel.deleteMonitor('${m.id}')">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染空状态
     */
    function renderEmptyMonitors() {
        const list = document.getElementById('monitorList');
        list.innerHTML = `
            <div class="ui-empty">
                <div class="ui-empty-icon">🔍</div>
                <div class="ui-empty-title">暂无监控</div>
                <div class="ui-empty-desc">点击右上角 + 添加竞品监控</div>
            </div>
        `;
    }

    /**
     * 加载告警列表
     */
    async function loadAlerts() {
        try {
            const result = await CardsAPI.request(`${API_BASE}/alerts?limit=10`);
            if (result.success) {
                alerts = result.data;
                renderAlerts();
            }
        } catch (error) {
            console.error('加载告警失败:', error);
            renderEmptyAlerts();
        }
    }

    /**
     * 渲染告警列表
     */
    function renderAlerts() {
        const list = document.getElementById('alertList');

        if (alerts.length === 0) {
            renderEmptyAlerts();
            return;
        }

        list.innerHTML = alerts.map(a => `
            <div class="alert-item ${a.isRead ? 'read' : 'unread'}" data-id="${a.id}" onclick="CompetitorIntel.readAlert('${a.id}')">
                <div class="alert-icon">🔔</div>
                <div class="alert-content">
                    <div class="alert-title">${a.competitorName}</div>
                    <div class="alert-desc">${a.content}</div>
                    <div class="alert-time">${Utils.formatDate(a.createdAt)}</div>
                </div>
                ${!a.isRead ? '<div class="alert-dot"></div>' : ''}
            </div>
        `).join('');
    }

    /**
     * 渲染空告警
     */
    function renderEmptyAlerts() {
        const list = document.getElementById('alertList');
        list.innerHTML = `
            <div class="ui-empty small">
                <div class="ui-empty-title">暂无告警</div>
            </div>
        `;
    }

    /**
     * 加载对比矩阵
     */
    async function loadMatrix() {
        try {
            const result = await CardsAPI.request(`${API_BASE}/matrix`);
            if (result.success) {
                renderMatrix(result.data);
            }
        } catch (error) {
            console.error('加载矩阵失败:', error);
        }
    }

    /**
     * 渲染对比矩阵
     */
    function renderMatrix(data) {
        const section = document.getElementById('matrixSection');
        const container = document.getElementById('matrixContainer');
        
        section.style.display = 'block';
        
        const dimensions = data.dimensions;
        const competitors = data.competitors;
        
        container.innerHTML = `
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>竞品</th>
                        ${dimensions.map(d => `<th>${data.dimensionLabels[d]}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${competitors.map(c => `
                        <tr>
                            <td class="matrix-name">${c.name}</td>
                            ${dimensions.map(d => `
                                <td>${c.dimensions.includes(d) ? '✅' : '❌'}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * 显示添加弹窗
     */
    function showModal() {
        document.getElementById('addModal').classList.add('show');
        document.getElementById('competitorName').focus();
    }

    /**
     * 关闭弹窗
     */
    function closeModal() {
        document.getElementById('addModal').classList.remove('show');
        // 清空表单
        document.getElementById('competitorName').value = '';
        document.getElementById('competitorUrl').value = '';
    }

    /**
     * 添加监控
     */
    async function addMonitor() {
        const name = document.getElementById('competitorName').value.trim();
        const url = document.getElementById('competitorUrl').value.trim();
        
        if (!name) {
            UI.showToast('请输入竞品名称', 'warning');
            return;
        }

        // 获取选中的维度
        const dimensions = [];
        document.querySelectorAll('.checkbox-item input:checked').forEach(cb => {
            dimensions.push(cb.value);
        });

        if (dimensions.length === 0) {
            UI.showToast('请至少选择一个监控维度', 'warning');
            return;
        }

        const btn = document.querySelector('#addModal .ui-btn-primary');
        btn.disabled = true;
        btn.textContent = '添加中...';

        try {
            const result = await CardsAPI.request(`${API_BASE}/monitors`, {
                method: 'POST',
                body: { name, url, dimensions }
            });

            if (result.success) {
                UI.showToast('添加成功', 'success');
                closeModal();
                loadData(); // 刷新所有数据
            }
        } catch (error) {
            UI.showToast('添加失败: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '添加';
        }
    }

    /**
     * 检查单个监控
     */
    async function checkMonitor(id) {
        const btn = document.querySelector(`[data-id="${id}"] .action-btn`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = '检查中...';
        }

        try {
            const result = await CardsAPI.request(`${API_BASE}/monitors/${id}/check`, {
                method: 'POST'
            });

            if (result.success) {
                const newAlerts = result.data.newAlerts;
                UI.showToast(`检查完成，发现 ${newAlerts} 个变化`, newAlerts > 0 ? 'success' : 'info');
                loadData();
            }
        } catch (error) {
            UI.showToast('检查失败', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '检查';
            }
        }
    }

    /**
     * 删除监控
     */
    async function deleteMonitor(id) {
        const confirmed = await UI.confirm('确定要删除这个监控吗？');
        if (!confirmed) return;

        try {
            const result = await CardsAPI.request(`${API_BASE}/monitors/${id}`, {
                method: 'DELETE'
            });

            if (result.success) {
                UI.showToast('删除成功', 'success');
                loadData();
            }
        } catch (error) {
            UI.showToast('删除失败', 'error');
        }
    }

    /**
     * 刷新全部
     */
    async function refreshAll() {
        if (isLoading) return;
        
        isLoading = true;
        const btn = document.getElementById('refreshBtn');
        btn.classList.add('spinning');

        UI.showToast('正在刷新...', 'info');

        try {
            const result = await CardsAPI.request(`${API_BASE}/check-all`, {
                method: 'POST'
            });

            if (result.success) {
                const newAlerts = result.data.newAlerts;
                UI.showToast(`刷新完成，发现 ${newAlerts} 个变化`, newAlerts > 0 ? 'success' : 'info');
                loadData();
            }
        } catch (error) {
            UI.showToast('刷新失败', 'error');
        } finally {
            isLoading = false;
            btn.classList.remove('spinning');
        }
    }

    /**
     * 标记告警已读
     */
    async function readAlert(id) {
        try {
            await CardsAPI.request(`${API_BASE}/alerts/${id}/read`, {
                method: 'PUT'
            });
            
            // 更新本地状态
            const alert = alerts.find(a => a.id === id);
            if (alert) {
                alert.isRead = true;
                renderAlerts();
                loadStats();
            }
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    }

    /**
     * 查看全部告警
     */
    function showAllAlerts() {
        // 可以跳转到告警详情页或显示更多告警
        UI.showToast('功能开发中...', 'info');
    }

    /**
     * 获取维度标签
     */
    function getDimensionLabel(dim) {
        const labels = {
            price: '价格',
            product: '产品',
            marketing: '营销',
            content: '内容'
        };
        return labels[dim] || dim;
    }

    // 暴露接口
    return {
        init,
        showModal,
        closeModal,
        addMonitor,
        checkMonitor,
        deleteMonitor,
        refreshAll,
        readAlert,
        showAllAlerts
    };
})();

// 启动
document.addEventListener('DOMContentLoaded', CompetitorIntel.init);
