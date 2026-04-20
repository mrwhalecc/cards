/* ============================================================
   竞品情报员 - 生产级Skill逻辑
   调用chatapi后端: /api/cards/competitor-intel/*
   ============================================================ */

const CompetitorIntel = (() => {
    // API基础路径
    const API_BASE = '/api/admin/cards/competitor-intel';
    
    // 状态
    let monitors = [];
    let alerts = [];
    let isLoading = false;
    let currentEditingId = null;

    /**
     * 初始化
     */
    function init() {
        // 检查是否是测试模式（URL参数 ?test=1）
        const urlParams = new URLSearchParams(window.location.search);
        const isTestMode = urlParams.get('test') === '1';

        // 如果不是测试模式且没有token，跳转到boss登录页
        if (!isTestMode && !CardsAPI.getToken()) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `https://boss.mrwhalex.com/login.html?redirect=${currentUrl}`;
            return;
        }

        // 绑定事件
        document.getElementById('addBtn').addEventListener('click', () => showModal());
        document.getElementById('refreshBtn').addEventListener('click', refreshAll);
        document.getElementById('addModal').addEventListener('click', (e) => {
            if (e.target.id === 'addModal') closeModal();
        });

        // 显示加载状态
        showLoading();
        
        // 加载数据
        loadData();

        // 定时刷新（每5分钟）
        setInterval(refreshAll, 5 * 60 * 1000);
    }

    /**
     * 显示加载状态
     */
    function showLoading() {
        document.getElementById('monitorList').innerHTML = createSkeleton();
        document.getElementById('alertList').innerHTML = createSkeleton();
    }

    /**
     * 创建骨架屏
     */
    function createSkeleton() {
        return `
            <div class="skeleton-card">
                <div class="skeleton-header">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-lines">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
                <div class="skeleton-tags">
                    <div class="skeleton-tag"></div>
                    <div class="skeleton-tag"></div>
                </div>
            </div>
        `.repeat(3);
    }

    /**
     * 加载所有数据
     */
    async function loadData() {
        try {
            const [statsResult, monitorsResult, alertsResult] = await Promise.all([
                loadStats().catch(err => ({ error: err })),
                loadMonitors().catch(err => ({ error: err })),
                loadAlerts().catch(err => ({ error: err }))
            ]);

            // 检查是否有错误
            const errors = [];
            if (statsResult.error) errors.push('统计加载失败');
            if (monitorsResult.error) errors.push('监控列表加载失败');
            if (alertsResult.error) errors.push('告警加载失败');
            
            if (errors.length > 0) {
                console.error('部分数据加载失败:', errors);
                UI.showToast('部分数据加载失败，请刷新重试', 'warning');
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            UI.showToast('加载数据失败，请检查网络', 'error');
            renderErrorState();
        }
    }

    /**
     * 渲染错误状态
     */
    function renderErrorState() {
        const list = document.getElementById('monitorList');
        list.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-title">加载失败</div>
                <div class="error-desc">网络异常，请检查网络连接后重试</div>
                <button class="ui-btn ui-btn-primary" onclick="CompetitorIntel.loadData()">
                    重新加载
                </button>
            </div>
        `;
    }

    /**
     * 加载统计
     */
    async function loadStats() {
        try {
            const result = await CardsAPI.request(`${API_BASE}/stats`);
            if (result.success) {
                document.getElementById('totalMonitors').textContent = result.data.totalMonitors || 0;
                document.getElementById('activeMonitors').textContent = result.data.activeMonitors || 0;
                document.getElementById('unreadAlerts').textContent = result.data.unreadAlerts || 0;
                document.getElementById('totalAlerts').textContent = result.data.totalAlerts || 0;
                
                // 有新告警时高亮显示
                if (result.data.unreadAlerts > 0) {
                    document.getElementById('alertCard').style.display = 'flex';
                }
            }
            return result;
        } catch (error) {
            console.error('加载统计失败:', error);
            throw error;
        }
    }

    /**
     * 加载监控列表
     */
    async function loadMonitors() {
        try {
            const result = await CardsAPI.request(`${API_BASE}/monitors`);
            if (result.success) {
                monitors = result.data || [];
                renderMonitors();
            }
            return result;
        } catch (error) {
            console.error('加载监控列表失败:', error);
            renderEmptyMonitors();
            throw error;
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
            // 没有数据时显示引导页和演示示例
            showGuideMode();
            return;
        }

        // 有数据时显示真实数据区域
        showDataMode();

        list.innerHTML = monitors.map(m => `
            <div class="monitor-card ${m.status === 'active' ? '' : 'paused'}" data-id="${m.id}">
                <div class="monitor-main">
                    <div class="monitor-info">
                        <h3 class="monitor-name">${escapeHtml(m.name)}</h3>
                        ${m.url ? `<a href="${escapeHtml(m.url)}" target="_blank" class="monitor-url">${escapeHtml(m.url)}</a>` : ''}
                    </div>
                    <div class="monitor-status">
                        <span class="status-dot ${m.status}"></span>
                        <span class="status-text">${m.status === 'active' ? '监控中' : '已暂停'}</span>
                    </div>
                </div>
                
                <div class="monitor-dimensions">
                    ${(m.dimensions || []).map(d => `<span class="dim-tag">${getDimensionLabel(d)}</span>`).join('')}
                </div>
                
                <div class="monitor-footer">
                    <span class="last-check">上次检查: ${m.lastCheckAt ? formatDate(m.lastCheckAt) : '未检查'}</span>
                    <div class="monitor-actions">
                        <button class="ui-btn ui-btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="CompetitorIntel.checkMonitor('${m.id}')">检查</button>
                        <button class="ui-btn ui-btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="CompetitorIntel.editMonitor('${m.id}')">编辑</button>
                        <button class="ui-btn" style="padding: 6px 12px; font-size: 12px; background: #fee2e2; color: #ef4444; border: none;" onclick="CompetitorIntel.deleteMonitor('${m.id}')">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 显示引导模式（首次使用）
     */
    function showGuideMode() {
        document.getElementById('guideSection').style.display = 'block';
        document.getElementById('demoSection').style.display = 'block';
        document.getElementById('statsSection').style.display = 'none';
        document.getElementById('monitorsSection').style.display = 'none';
        document.getElementById('alertsSection').style.display = 'none';
    }

    /**
     * 显示数据模式（有监控数据）
     */
    function showDataMode() {
        document.getElementById('guideSection').style.display = 'none';
        document.getElementById('demoSection').style.display = 'none';
        document.getElementById('statsSection').style.display = 'grid';
        document.getElementById('monitorsSection').style.display = 'block';
        document.getElementById('alertsSection').style.display = 'block';
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
                alerts = result.data || [];
                renderAlerts();
            }
            return result;
        } catch (error) {
            console.error('加载告警失败:', error);
            renderEmptyAlerts();
            throw error;
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
            <div class="alert-item ${a.isRead ? 'read' : 'unread'}" data-id="${a.id}" onclick="CompetitorIntel.showAlertDetail('${a.id}')">
                <div class="alert-icon">${getAlertIcon(a.type)}</div>
                <div class="alert-content">
                    <div class="alert-title">${escapeHtml(a.competitorName || '未知竞品')}</div>
                    <div class="alert-desc">${escapeHtml(a.content || '')}</div>
                    <div class="alert-time">${formatDate(a.createdAt)}</div>
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
                <div class="ui-empty-icon">🔔</div>
                <div class="ui-empty-title">暂无告警</div>
                <div class="ui-empty-desc">当检测到竞品变化时会在这里显示</div>
            </div>
        `;
    }

    /**
     * 显示告警详情
     */
    function showAlertDetail(id) {
        const alert = alerts.find(a => a.id === id);
        if (!alert) return;

        // 显示详情弹窗
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3>告警详情</h3>
                <div class="alert-detail">
                    <div class="detail-row">
                        <span class="detail-label">竞品：</span>
                        <span class="detail-value">${escapeHtml(alert.competitorName)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">类型：</span>
                        <span class="detail-value">${getDimensionLabel(alert.type)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">时间：</span>
                        <span class="detail-value">${formatDate(alert.createdAt)}</span>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">变化内容：</div>
                        <div class="detail-text">${escapeHtml(alert.content)}</div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="ui-btn ui-btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                    ${!alert.isRead ? `<button class="ui-btn ui-btn-primary" onclick="CompetitorIntel.readAlert('${alert.id}'); this.closest('.modal').remove()">标记已读</button>` : ''}
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    }

    /**
     * 显示添加/编辑弹窗
     */
    function showModal(monitorId = null) {
        currentEditingId = monitorId;
        const modal = document.getElementById('addModal');
        const title = modal.querySelector('h3');
        const btn = modal.querySelector('.ui-btn-primary');
        
        if (monitorId) {
            // 编辑模式
            const monitor = monitors.find(m => m.id === monitorId);
            if (!monitor) return;
            
            title.textContent = '编辑竞品监控';
            btn.textContent = '保存修改';
            document.getElementById('competitorName').value = monitor.name || '';
            document.getElementById('competitorUrl').value = monitor.url || '';
            
            // 设置维度选中状态
            const checkboxes = modal.querySelectorAll('.checkbox-item input');
            checkboxes.forEach(cb => {
                cb.checked = monitor.dimensions && monitor.dimensions.includes(cb.value);
            });
        } else {
            // 添加模式
            title.textContent = '添加竞品监控';
            btn.textContent = '开始监控';
            document.getElementById('competitorName').value = '';
            document.getElementById('competitorUrl').value = '';
            
            // 重置维度选中状态
            const checkboxes = modal.querySelectorAll('.checkbox-item input');
            checkboxes.forEach(cb => {
                cb.checked = ['price', 'product'].includes(cb.value);
            });
        }
        
        modal.classList.add('show');
        document.getElementById('competitorName').focus();
    }

    /**
     * 关闭弹窗
     */
    function closeModal() {
        document.getElementById('addModal').classList.remove('show');
        currentEditingId = null;
    }

    /**
     * 添加/编辑监控
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
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-small"></span>保存中...';

        try {
            let result;
            if (currentEditingId) {
                // 编辑模式
                result = await CardsAPI.request(`${API_BASE}/monitors/${currentEditingId}`, {
                    method: 'PUT',
                    body: { name, url, dimensions }
                });
            } else {
                // 添加模式
                result = await CardsAPI.request(`${API_BASE}/monitors`, {
                    method: 'POST',
                    body: { name, url, dimensions }
                });
            }

            if (result.success) {
                UI.showToast(currentEditingId ? '修改成功' : '添加成功', 'success');
                closeModal();
                loadData(); // 刷新所有数据
            } else {
                throw new Error(result.error || '操作失败');
            }
        } catch (error) {
            console.error('保存失败:', error);
            UI.showToast('保存失败: ' + (error.message || '网络错误'), 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    /**
     * 编辑监控
     */
    function editMonitor(id) {
        showModal(id);
    }

    /**
     * 检查单个监控
     */
    async function checkMonitor(id) {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-small"></span>检查中';

        try {
            const result = await CardsAPI.request(`${API_BASE}/monitors/${id}/check`, {
                method: 'POST'
            });

            if (result.success) {
                const newAlerts = result.data.newAlerts;
                if (newAlerts > 0) {
                    UI.showToast(`发现 ${newAlerts} 个变化！`, 'success');
                } else {
                    UI.showToast('暂无变化', 'info');
                }
                loadData();
            } else {
                throw new Error(result.error || '检查失败');
            }
        } catch (error) {
            console.error('检查失败:', error);
            UI.showToast('检查失败: ' + (error.message || '网络错误'), 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    /**
     * 删除监控
     */
    async function deleteMonitor(id) {
        const confirmed = await UI.confirm('确定要删除这个监控吗？删除后将无法恢复。');
        if (!confirmed) return;

        try {
            const result = await CardsAPI.request(`${API_BASE}/monitors/${id}`, {
                method: 'DELETE'
            });

            if (result.success) {
                UI.showToast('删除成功', 'success');
                loadData();
            } else {
                throw new Error(result.error || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            UI.showToast('删除失败: ' + (error.message || '网络错误'), 'error');
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
                if (newAlerts > 0) {
                    UI.showToast(`发现 ${newAlerts} 个变化！`, 'success');
                } else {
                    UI.showToast('暂无新变化', 'info');
                }
                loadData();
            } else {
                throw new Error(result.error || '刷新失败');
            }
        } catch (error) {
            console.error('刷新失败:', error);
            UI.showToast('刷新失败: ' + (error.message || '网络错误'), 'error');
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
            UI.showToast('操作失败', 'error');
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
            price: '价格变动',
            product: '产品更新',
            marketing: '营销活动',
            content: '内容动态',
            other: '其他变化'
        };
        return labels[dim] || dim;
    }

    /**
     * 获取告警图标
     */
    function getAlertIcon(type) {
        const icons = {
            price: '💰',
            product: '🎁',
            marketing: '🎉',
            content: '📝',
            other: '🔔'
        };
        return icons[type] || '🔔';
    }

    /**
     * HTML转义，防止XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 格式化日期
     */
    function formatDate(dateString) {
        if (!dateString) return '未知时间';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // 小于1分钟
        if (diff < 60000) return '刚刚';
        // 小于1小时
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        // 小于24小时
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        // 小于7天
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }

    // 暴露接口
    return {
        init,
        loadData,
        showModal,
        closeModal,
        addMonitor,
        editMonitor,
        checkMonitor,
        deleteMonitor,
        refreshAll,
        readAlert,
        showAllAlerts,
        showAlertDetail
    };
})();

// 启动
document.addEventListener('DOMContentLoaded', CompetitorIntel.init);
