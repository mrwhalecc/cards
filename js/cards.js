/* ============================================================
   Cards项目 - 主应用逻辑
   ============================================================ */

const CardsApp = (() => {
    // 30个Skill配置（根据BOSS-Skill-Reference-Catalog.md）
    const SKILLS = [
        // 商业场景（16个）
        { id: 'sdr_cultivator', name: 'SDR线索培育员', category: 'business', icon: '🎯', desc: '自动化培育潜在客户，提升转化率', status: 'dev' },
        { id: 'ad_optimizer', name: '广告智能投手', category: 'business', icon: '📢', desc: '智能优化广告投放策略', status: 'dev' },
        { id: 'content_operator', name: '内容运营官', category: 'business', icon: '✍️', desc: '全平台内容策划与发布', status: 'dev' },
        { id: 'review_specialist', name: '评价管理专员', category: 'business', icon: '⭐', desc: '监控和优化用户评价', status: 'dev' },
        { id: 'salary_calculator', name: '薪酬精算师', category: 'business', icon: '💰', desc: '制定合理的薪酬方案', status: 'dev' },
        { id: 'data_analysis', name: '数据智查', category: 'business', icon: '📊', desc: '深度分析经营数据，发现关键洞察', status: 'ready' },
        { id: 'meeting_efficiency', name: '会议效率官', category: 'business', icon: '🤝', desc: '优化会议流程，提升沟通效率', status: 'dev' },
        { id: 'recruit_specialist', name: '招聘识人官', category: 'business', icon: '👥', desc: 'AI辅助人才筛选与面试', status: 'dev' },
        { id: 'competitor_intel', name: '竞品情报员', category: 'business', icon: '🔍', desc: '实时监控竞品动态，洞察市场趋势', status: 'ready' },
        { id: 'social_media_monitor', name: '社媒监测员', category: 'business', icon: '📱', desc: '追踪品牌舆情和社媒表现', status: 'dev' },
        { id: 'contract_review', name: '合同审查官', category: 'business', icon: '📜', desc: 'AI辅助合同风险审查', status: 'dev' },
        { id: 'financial_analyst', name: '财务报表分析师', category: 'business', icon: '📈', desc: '自动分析财务报表，生成解读报告', status: 'dev' },
        { id: 'new_project_planner', name: '新项目推演师', category: 'business', icon: '🚀', desc: '推演新项目可行性，评估风险收益', status: 'ready' },
        { id: 'marketing_writer', name: '营销文案师', category: 'business', icon: '📝', desc: '生成高转化营销文案', status: 'dev' },
        { id: 'file_assistant', name: '文件速读助手', category: 'business', icon: '📄', desc: '快速提取文件关键信息', status: 'dev' },
        { id: 'research_specialist', name: '调研专家', category: 'business', icon: '🔬', desc: '自动化市场调研，生成分析报告', status: 'dev' },
        
        // 求是成长（8个）
        { id: 'reading_curator', name: '求是读书官', category: 'growth', icon: '📚', desc: '个性化阅读推荐与笔记管理', status: 'dev' },
        { id: 'learning_assistant', name: '学习助手', category: 'growth', icon: '🎓', desc: '制定学习计划，跟踪学习进度', status: 'dev' },
        { id: 'habit_builder', name: '习惯养成官', category: 'growth', icon: '✅', desc: '帮助建立和坚持好习惯', status: 'dev' },
        { id: 'time_manager', name: '时间管理官', category: 'growth', icon: '⏰', desc: '优化时间分配，提升效率', status: 'dev' },
        { id: 'thinking_assistant', name: '思维训练官', category: 'growth', icon: '🧠', desc: '结构化思维训练与提升', status: 'dev' },
        { id: 'decision_advisor', name: '决策顾问', category: 'growth', icon: '⚖️', desc: '辅助重大决策分析', status: 'dev' },
        { id: 'career_planner', name: '职业规划官', category: 'growth', icon: '🎯', desc: '个人职业发展规划', status: 'dev' },
        { id: 'wellness_coach', name: '身心健康官', category: 'growth', icon: '💪', desc: '健康管理与压力调节', status: 'dev' },
        
        // 轻松测试（6个）
        { id: 'business_sense_test', name: '商业嗅觉测试', category: 'test', icon: '🐕', desc: '测试你的商业敏感度', status: 'dev' },
        { id: 'leadership_test', name: '领导力潜力测试', category: 'test', icon: '👑', desc: '评估你的领导潜质', status: 'dev' },
        { id: 'stress_test', name: '抗压能力测试', category: 'test', icon: '🔥', desc: '测试你的压力承受力', status: 'dev' },
        { id: 'creativity_test', name: '创新思维测试', category: 'test', icon: '💡', desc: '评估你的创新能力', status: 'dev' },
        { id: 'decision_test', name: '决策风格测试', category: 'test', icon: '🎲', desc: '了解你的决策模式', status: 'dev' },
        { id: 'communication_test', name: '沟通风格测试', category: 'test', icon: '💬', desc: '分析你的沟通特点', status: 'dev' }
    ];

    let currentCategory = 'all';

    /**
     * 初始化应用
     */
    function init() {
        // 首先检查URL参数中的token（Boss登录回调）
        Auth.init();
        
        // 检查认证
        if (!Auth.checkAuth()) {
            return;
        }

        // 渲染Skill列表
        renderSkills();

        // 绑定事件
        bindEvents();

        // 加载用户信息
        loadUserInfo();
    }

    /**
     * 渲染Skill列表
     */
    function renderSkills() {
        const grid = document.getElementById('skillsGrid');
        if (!grid) return;

        const filtered = currentCategory === 'all' 
            ? SKILLS 
            : SKILLS.filter(s => s.category === currentCategory);

        grid.innerHTML = filtered.map(skill => `
            <div class="skill-card" data-skill-id="${skill.id}">
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-info">
                    <h3>${skill.name}</h3>
                    <p>${skill.desc}</p>
                    <span class="skill-status ${skill.status}">${skill.status === 'ready' ? '可用' : '开发中'}</span>
                </div>
            </div>
        `).join('');

        // 绑定卡片点击事件
        grid.querySelectorAll('.skill-card').forEach(card => {
            card.addEventListener('click', () => {
                const skillId = card.dataset.skillId;
                launchSkill(skillId);
            });
        });
    }

    /**
     * 启动Skill
     */
    function launchSkill(skillId) {
        const skill = SKILLS.find(s => s.id === skillId);
        if (!skill) return;

        if (skill.status !== 'ready') {
            alert('该Skill正在开发中...');
            return;
        }

        // 跳转到Skill页面
        window.location.href = `/skills/${skillId}/index.html`;
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        // 分类标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                renderSkills();
            });
        });

        // 用户菜单
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                const action = confirm('确定要退出登录吗？') ? 'logout' : 'cancel';
                if (action === 'logout') {
                    Auth.clearAuth();
                    window.location.reload();
                }
            });
        }
    }

    /**
     * 加载用户信息
     */
    async function loadUserInfo() {
        try {
            const user = await CardsAPI.getCurrentUser();
            if (user) {
                console.log('当前用户:', user);
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    }

    return {
        init,
        renderSkills,
        launchSkill
    };
})();
