/* ============================================================
   Cards项目 - UI组件库
   从 boss/js/cards/card-utils.js 迁移
   ============================================================ */

const UI = (() => {
    /**
     * 显示加载动画
     * @param {HTMLElement} container - 容器元素
     * @param {string} text - 加载文字
     */
    function showLoading(container, text = '加载中...') {
        const loading = document.createElement('div');
        loading.className = 'ui-loading';
        loading.innerHTML = `
            <div class="ui-loading-spinner"></div>
            <span class="ui-loading-text">${text}</span>
        `;
        container.appendChild(loading);
        return loading;
    }

    /**
     * 隐藏加载动画
     * @param {HTMLElement} container - 容器元素
     */
    function hideLoading(container) {
        const loading = container.querySelector('.ui-loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * 显示Toast提示
     * @param {string} message - 消息内容
     * @param {string} type - 类型: success|error|warning|info
     * @param {number} duration - 显示时长(ms)
     */
    function showToast(message, type = 'info', duration = 3000) {
        // 移除已存在的toast
        const existing = document.querySelector('.ui-toast');
        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = `ui-toast ui-toast-${type}`;
        toast.innerHTML = `
            <span class="ui-toast-icon">${getToastIcon(type)}</span>
            <span class="ui-toast-message">${message}</span>
        `;

        document.body.appendChild(toast);

        // 动画进入
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自动关闭
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * 获取Toast图标
     */
    function getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * 显示确认对话框
     * @param {string} message - 确认消息
     * @returns {Promise<boolean>} - 用户选择结果
     */
    function confirm(message) {
        return new Promise((resolve) => {
            // 创建遮罩
            const overlay = document.createElement('div');
            overlay.className = 'ui-modal-overlay';

            // 创建对话框
            const modal = document.createElement('div');
            modal.className = 'ui-confirm-modal';
            modal.innerHTML = `
                <div class="ui-confirm-content">
                    <p class="ui-confirm-message">${message}</p>
                    <div class="ui-confirm-actions">
                        <button class="ui-btn ui-btn-secondary" data-action="cancel">取消</button>
                        <button class="ui-btn ui-btn-primary" data-action="confirm">确定</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(modal);

            // 绑定事件
            const handleClick = (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                } else if (action === 'cancel') {
                    resolve(false);
                }
                cleanup();
            };

            const cleanup = () => {
                overlay.remove();
                modal.remove();
            };

            modal.addEventListener('click', handleClick);
            overlay.addEventListener('click', () => {
                resolve(false);
                cleanup();
            });

            // ESC关闭
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    resolve(false);
                    cleanup();
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }

    /**
     * 创建模态框
     * @param {Object} options - 配置选项
     */
    function createModal(options = {}) {
        const { title = '', content = '', onClose = null, showClose = true } = options;

        const overlay = document.createElement('div');
        overlay.className = 'ui-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'ui-modal';
        modal.innerHTML = `
            ${showClose ? '<button class="ui-modal-close">&times;</button>' : ''}
            ${title ? `<div class="ui-modal-header">${title}</div>` : ''}
            <div class="ui-modal-body">${content}</div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // 动画
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            modal.classList.add('show');
        });

        // 关闭函数
        const close = () => {
            overlay.classList.remove('show');
            modal.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                modal.remove();
                if (onClose) onClose();
            }, 300);
        };

        // 绑定关闭事件
        if (showClose) {
            modal.querySelector('.ui-modal-close').addEventListener('click', close);
        }
        overlay.addEventListener('click', close);

        return { modal, overlay, close };
    }

    /**
     * 表单验证
     * @param {Object} data - 表单数据
     * @param {Object} rules - 验证规则
     */
    function validate(data, rules) {
        const errors = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];

            if (rule.required && !value) {
                errors[field] = rule.message || `${field}不能为空`;
                continue;
            }

            if (value && rule.min && value.length < rule.min) {
                errors[field] = rule.message || `${field}最少${rule.min}个字符`;
            }

            if (value && rule.max && value.length > rule.max) {
                errors[field] = rule.message || `${field}最多${rule.max}个字符`;
            }

            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.message || `${field}格式不正确`;
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    return {
        showLoading,
        hideLoading,
        showToast,
        confirm,
        createModal,
        validate
    };
})();
