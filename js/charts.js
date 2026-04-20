/* ============================================================
   Cards项目 - 图表组件库
   基于 ECharts 的图表封装
   从 boss/js/cards/card-charts.js 迁移
   ============================================================ */

const Charts = (() => {
    // 默认主题色
    const THEME_COLORS = [
        '#b8954e', '#d4a84c', '#8b7030', '#e8c547',
        '#f4d03f', '#d68910', '#a0522d', '#cd853f'
    ];

    // 图表实例管理
    const instances = new Map();

    /**
     * 创建折线图
     * @param {string} containerId - 容器ID
     * @param {Object} options - 配置选项
     */
    function createLineChart(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[Charts] 容器不存在: ${containerId}`);
            return null;
        }

        if (typeof echarts === 'undefined') {
            console.error('[Charts] ECharts 未加载');
            return null;
        }

        const chart = echarts.init(container);

        const option = {
            color: options.colors || THEME_COLORS,
            title: {
                text: options.title || '',
                left: 'center',
                textStyle: { fontSize: 14, color: '#333' }
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: options.legend || [],
                bottom: 0
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: options.xAxis || []
            },
            yAxis: {
                type: 'value'
            },
            series: options.series || []
        };

        chart.setOption(option);
        instances.set(containerId, chart);

        // 响应式
        window.addEventListener('resize', () => chart.resize());

        return chart;
    }

    /**
     * 创建柱状图
     * @param {string} containerId - 容器ID
     * @param {Object} options - 配置选项
     */
    function createBarChart(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        if (typeof echarts === 'undefined') {
            console.error('[Charts] ECharts 未加载');
            return null;
        }

        const chart = echarts.init(container);

        const option = {
            color: options.colors || THEME_COLORS,
            title: {
                text: options.title || '',
                left: 'center',
                textStyle: { fontSize: 14, color: '#333' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: options.legend || [],
                bottom: 0
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: options.xAxis || [],
                axisTick: { alignWithLabel: true }
            },
            yAxis: {
                type: 'value'
            },
            series: options.series || []
        };

        chart.setOption(option);
        instances.set(containerId, chart);

        window.addEventListener('resize', () => chart.resize());

        return chart;
    }

    /**
     * 创建饼图
     * @param {string} containerId - 容器ID
     * @param {Object} options - 配置选项
     */
    function createPieChart(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        if (typeof echarts === 'undefined') {
            console.error('[Charts] ECharts 未加载');
            return null;
        }

        const chart = echarts.init(container);

        const option = {
            color: options.colors || THEME_COLORS,
            title: {
                text: options.title || '',
                left: 'center',
                textStyle: { fontSize: 14, color: '#333' }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                data: options.legend || []
            },
            series: [{
                name: options.seriesName || '',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                labelLine: { show: false },
                data: options.data || []
            }]
        };

        chart.setOption(option);
        instances.set(containerId, chart);

        window.addEventListener('resize', () => chart.resize());

        return chart;
    }

    /**
     * 创建雷达图
     * @param {string} containerId - 容器ID
     * @param {Object} options - 配置选项
     */
    function createRadarChart(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        if (typeof echarts === 'undefined') {
            console.error('[Charts] ECharts 未加载');
            return null;
        }

        const chart = echarts.init(container);

        const option = {
            color: options.colors || THEME_COLORS,
            title: {
                text: options.title || '',
                left: 'center'
            },
            tooltip: {},
            legend: {
                data: options.legend || [],
                bottom: 0
            },
            radar: {
                indicator: options.indicator || [],
                radius: '65%'
            },
            series: [{
                name: options.seriesName || '',
                type: 'radar',
                data: options.series || []
            }]
        };

        chart.setOption(option);
        instances.set(containerId, chart);

        window.addEventListener('resize', () => chart.resize());

        return chart;
    }

    /**
     * 更新图表
     * @param {string} containerId - 容器ID
     * @param {Object} newOptions - 新配置
     */
    function updateChart(containerId, newOptions) {
        const chart = instances.get(containerId);
        if (chart) {
            chart.setOption(newOptions);
        }
    }

    /**
     * 销毁图表
     * @param {string} containerId - 容器ID
     */
    function destroyChart(containerId) {
        const chart = instances.get(containerId);
        if (chart) {
            chart.dispose();
            instances.delete(containerId);
        }
    }

    /**
     * 销毁所有图表
     */
    function destroyAll() {
        instances.forEach(chart => chart.dispose());
        instances.clear();
    }

    return {
        createLineChart,
        createBarChart,
        createPieChart,
        createRadarChart,
        updateChart,
        destroyChart,
        destroyAll
    };
})();
