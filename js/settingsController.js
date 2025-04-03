/**
 * 设置控制器
 */
const SettingsController = {
    // 常量定义
    TEMPLATES: {
        LUNCH_BREAK_NOTICE: `
            <div class="bg-blue-50 p-3 rounded text-sm text-blue-800">
                <p><i class="ri-information-line mr-1"></i>如果您的企业统计工时包含午休时间，请关闭"扣除"开关。</p>
            </div>
        `,
        ABOUT_SECTION: `
            <div>
                <h3 class="text-lg font-medium mb-3">关于</h3>
                <div class="bg-gray-50 p-3 rounded text-sm">
                    <p>虽然什么都没干，但还是辛苦我了 v${CONFIG.APP_VERSION || '1.0.0'}</p>
                    <p class="mt-1">一个简单的工时追踪工具，记录您的工作时间和加班情况。</p>
                </div>
            </div>
        `
    },
    
    // 关于信息配置
    ABOUT_INFO: {
        TITLE: "辛苦我了 🐱",
        DESCRIPTION: "一个简单的工时追踪工具，记录您的工作时间和加班情况。</br> 100% 本地实现，无需担心数据隐私问题 ✅</br></br> Thank Cursor ♥️"
    },

    /**
     * 初始化设置控制器
     */
    init() {
        console.log('设置控制器初始化...');
        // 绑定设置按钮点击事件
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        // 绑定设置标签页点击事件
        const settingsTab = document.getElementById('tab-settings');
        if (settingsTab) {
            settingsTab.addEventListener('click', () => this.renderSettings());
        }
        
        // 更新index.html中的关于信息
        this.updateAboutInfo();
    },
    
    /**
     * 更新关于信息到DOM
     */
    updateAboutInfo() {
        // 更新设置页面中的关于信息
        const aboutDescElement = document.querySelector('#settings-content .bg-white:last-child p:last-child');
        if (aboutDescElement) {
            aboutDescElement.textContent = this.ABOUT_INFO.DESCRIPTION;
        }
        
        // 更新设置页面中的关于标题
        const aboutTitleElement = document.querySelector('#settings-content .bg-white:last-child p:first-of-type');
        if (aboutTitleElement) {
            aboutTitleElement.innerHTML = `${this.ABOUT_INFO.TITLE} v<span id="app-version">1.0.0</span>`;
        }
        
        // 更新页脚信息如果需要
        const footerElement = document.querySelector('footer .inline-flex');
        if (footerElement) {
            footerElement.innerHTML = `<i class="ri-cow-line mr-1 text-primary"></i>${this.ABOUT_INFO.TITLE.split('辛苦我了')[0]}辛苦我了 由 Github Pages 强力驱动`;
        }
    },

    /**
     * 格式化时间
     * @param {number} hour 小时
     * @param {number} minute 分钟
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(hour, minute) {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    },
    
    /**
     * 解析时间字符串
     * @param {string} timeStr 时间字符串，格式为 "HH:MM"
     * @returns {Array} 包含小时和分钟的数组 [hour, minute]
     */
    parseTime(timeStr) {
        // 默认值
        const defaultTime = [9, 0]; // 默认为9:00
        
        // 检查输入
        if (!timeStr || typeof timeStr !== 'string') {
            return defaultTime;
        }
        
        // 解析时间字符串
        const timeParts = timeStr.split(':').map(part => parseInt(part, 10));
        
        // 检查解析结果是否有效
        if (timeParts.length !== 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) {
            return defaultTime;
        }
        
        return timeParts;
    },

    /**
     * 生成工作时间设置HTML
     * @param {Object} config 配置对象
     * @returns {string} 工作时间设置HTML
     */
    generateWorkTimeSettingsHTML(config) {
        const { standardWorkHours, startHour, startMinute, endHour, endMinute, excludeBreakTime } = config;
        
        return `
            <div>
                <h3 class="text-lg font-medium mb-3">工作时间设置</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <label class="font-medium">标准工作时长</label>
                            <p class="text-xs text-gray-500">实际工作时间（扣除午休）</p>
                        </div>
                        <div class="flex items-center">
                            <input type="number" id="settings-standard-hours" min="1" max="12" value="${standardWorkHours}" 
                                   class="w-16 py-1 px-2 border border-gray-300 rounded text-center">
                            <span class="ml-2">小时</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <label class="font-medium">上班时间</label>
                        <div class="flex items-center">
                            <input type="time" id="settings-start-time" value="${this.formatTime(startHour, startMinute)}" 
                                   class="py-1 px-2 border border-gray-300 rounded">
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <label class="font-medium">下班时间</label>
                        <div class="flex items-center">
                            <input type="time" id="settings-end-time" value="${this.formatTime(endHour, endMinute)}" 
                                   class="py-1 px-2 border border-gray-300 rounded">
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <label class="font-medium">在工时计算中扣除午休时间</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settings-exclude-break-time" class="sr-only peer" ${excludeBreakTime ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    
                    ${this.TEMPLATES.LUNCH_BREAK_NOTICE}
                </div>
            </div>
        `;
    },
    
    /**
     * 生成关于部分的HTML
     * @returns {string} 关于部分的HTML
     */
    generateAboutSectionHTML() {
        return `
            <div>
                <h3 class="text-lg font-medium mb-3">关于</h3>
                <div class="bg-gray-50 p-3 rounded text-sm">
                    <p>${this.ABOUT_INFO.TITLE} v${CONFIG.APP_VERSION || '1.0.0'}</p>
                    <p class="mt-1">${this.ABOUT_INFO.DESCRIPTION}</p>
                </div>
            </div>
        `;
    },

    /**
     * 打开设置面板
     */
    openSettings() {
        // 获取当前配置
        let standardWorkHours = CONFIG.WORK_HOURS.STANDARD_HOURS;
        let startHour = CONFIG.WORK_HOURS.START_HOUR;
        let startMinute = CONFIG.WORK_HOURS.START_MINUTE;
        let endHour = CONFIG.WORK_HOURS.END_HOUR;
        let endMinute = CONFIG.WORK_HOURS.END_MINUTE;
        let excludeBreakTime = CONFIG.EXCLUDE_BREAK_TIME;

        // 创建设置弹出框
        const settingsModal = document.createElement('div');
        settingsModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        settingsModal.id = 'settings-modal';

        // 设置弹出框内容
        settingsModal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">应用设置</h2>
                    <button id="close-settings" class="text-gray-500 hover:text-gray-700">
                        <i class="ri-close-line text-2xl"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <!-- 工作时间设置 -->
                    ${this.generateWorkTimeSettingsHTML({
                        standardWorkHours,
                        startHour,
                        startMinute,
                        endHour,
                        endMinute,
                        excludeBreakTime
                    })}
                    
                    <!-- 关于 -->
                    ${this.generateAboutSectionHTML()}
                </div>
                
                <div class="mt-8 flex justify-end">
                    <button id="cancel-settings" class="mr-3 px-4 py-2 rounded border hover:bg-gray-100">
                        取消
                    </button>
                    <button id="save-settings" 
                            class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
                        保存设置
                    </button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(settingsModal);

        // 绑定关闭按钮事件
        document.getElementById('close-settings').addEventListener('click', () => {
            settingsModal.remove();
        });

        // 绑定取消按钮事件
        document.getElementById('cancel-settings').addEventListener('click', () => {
            settingsModal.remove();
        });

        // 绑定保存按钮事件
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
            settingsModal.remove();
        });
    },

    /**
     * 保存设置
     */
    saveSettings() {
        // 获取各设置项的值
        const standardHours = parseInt(document.getElementById('settings-standard-hours').value) || 8;
        const startTime = document.getElementById('settings-start-time').value;
        const endTime = document.getElementById('settings-end-time').value;
        const excludeBreakTime = document.getElementById('settings-exclude-break-time').checked;
        
        // 检查设置是否有变化
        const oldExcludeBreakTime = CONFIG.EXCLUDE_BREAK_TIME;
        const settingsChanged = oldExcludeBreakTime !== excludeBreakTime; // 特别检查午休设置是否变化
        
        // 解析时间
        const [startHour, startMinute] = this.parseTime(startTime);
        const [endHour, endMinute] = this.parseTime(endTime);
        
        // 创建配置对象
        const config = {
            standardWorkHours: standardHours,
            startHour: startHour,
            startMinute: startMinute,
            endHour: endHour,
            endMinute: endMinute,
            excludeBreakTime: excludeBreakTime
        };
        
        // 保存配置
        Store.saveConfig(config);
        
        // 更新配置
        TimerService.updateConfigSettings();
        
        // 如果是午休设置变化，确保立即更新统计数据
        if (settingsChanged) {
            console.log('午休设置已变更，立即更新统计数据', { 
                oldValue: oldExcludeBreakTime, 
                newValue: excludeBreakTime 
            });
            
            // 确保立即刷新统计数据
            if (StatsController && typeof StatsController.recalculateAllStats === 'function') {
                StatsController.recalculateAllStats();
            }
        }
        
        // 在设置页面显示保存成功通知
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-md shadow-md transition-opacity duration-300';
        successMessage.textContent = '设置已保存';
        document.body.appendChild(successMessage);
        
        // 3秒后移除通知
        setTimeout(() => {
            successMessage.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 300);
        }, 3000);
    },
    
    /**
     * 更新设置UI
     */
    updateSettings() {
        console.log('更新设置UI...');
        // 获取当前设置
        // 如果设置面板已经打开，则更新其UI
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            const standardHoursInput = document.getElementById('settings-standard-hours');
            const startTimeInput = document.getElementById('settings-start-time');
            const endTimeInput = document.getElementById('settings-end-time');
            const excludeBreakTimeInput = document.getElementById('settings-exclude-break-time');
            
            // 更新UI
            if (standardHoursInput) standardHoursInput.value = CONFIG.WORK_HOURS.STANDARD_HOURS;
            if (startTimeInput) startTimeInput.value = this.formatTime(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE);
            if (endTimeInput) endTimeInput.value = this.formatTime(CONFIG.WORK_HOURS.END_HOUR, CONFIG.WORK_HOURS.END_MINUTE);
            if (excludeBreakTimeInput) excludeBreakTimeInput.checked = CONFIG.EXCLUDE_BREAK_TIME;
            
            console.log('设置UI已更新');
        }
    },
    
    /**
     * 渲染设置页面内容到设置标签页
     */
    renderSettings() {
        console.log('渲染设置页面内容...');
        
        // 获取当前配置
        let standardWorkHours = CONFIG.WORK_HOURS.STANDARD_HOURS;
        let startHour = CONFIG.WORK_HOURS.START_HOUR;
        let startMinute = CONFIG.WORK_HOURS.START_MINUTE;
        let endHour = CONFIG.WORK_HOURS.END_HOUR;
        let endMinute = CONFIG.WORK_HOURS.END_MINUTE;
        let excludeBreakTime = CONFIG.EXCLUDE_BREAK_TIME;
        
        // 获取设置内容容器
        const settingsContent = document.getElementById('settings-content');
        if (!settingsContent) {
            console.error('找不到设置内容容器！');
            return;
        }
        
        // 设置内容HTML
        settingsContent.innerHTML = `
            <div class="space-y-6 p-4">
                <!-- 工作时间设置 -->
                ${this.generateWorkTimeSettingsHTML({
                    standardWorkHours,
                    startHour,
                    startMinute,
                    endHour,
                    endMinute,
                    excludeBreakTime
                })}
                
                <!-- 关于 -->
                ${this.generateAboutSectionHTML()}
                
                <div class="mt-8 flex justify-end">
                    <button id="save-settings-page" 
                            class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
                        保存设置
                    </button>
                </div>
            </div>
        `;
        
        // 在渲染完成后更新关于信息
        this.updateAboutInfo();
        
        // 绑定保存按钮事件
        document.getElementById('save-settings-page').addEventListener('click', () => {
            this.saveSettingsFromPage();
        });
    },
    
    /**
     * 从设置页面保存设置
     */
    saveSettingsFromPage() {
        // 获取设置值
        const standardWorkHours = parseInt(document.getElementById('settings-standard-hours').value, 10) || 8;
        const startTimeValue = document.getElementById('settings-start-time').value || '09:00';
        const endTimeValue = document.getElementById('settings-end-time').value || '18:00';
        const excludeBreakTime = document.getElementById('settings-exclude-break-time').checked;
        
        // 解析时间
        const [startHour, startMinute] = startTimeValue.split(':').map(Number);
        const [endHour, endMinute] = endTimeValue.split(':').map(Number);
        
        // 更新配置
        Store.saveConfig({
            standardWorkHours,
            startHour,
            startMinute,
            endHour,
            endMinute,
            excludeBreakTime
        });
        
        // 更新全局配置
        CONFIG.WORK_HOURS.STANDARD_HOURS = standardWorkHours;
        CONFIG.WORK_HOURS.START_HOUR = startHour;
        CONFIG.WORK_HOURS.START_MINUTE = startMinute;
        CONFIG.WORK_HOURS.END_HOUR = endHour;
        CONFIG.WORK_HOURS.END_MINUTE = endMinute;
        CONFIG.EXCLUDE_BREAK_TIME = excludeBreakTime;
        
        // 同时更新用户偏好设置中的工作时间
        Store.save(CONFIG.STORAGE_KEYS.USER_WORK_HOURS, {
            standardHours: standardWorkHours,
            startHour,
            startMinute,
            endHour,
            endMinute,
            excludeBreakTime
        });
        
        // 更新TimerService的配置
        if (TimerService && typeof TimerService.updateConfigSettings === 'function') {
            TimerService.updateConfigSettings();
        }
        
        // 更新界面
        if (UIController && typeof UIController.updateUIBasedOnWorkStatus === 'function') {
            UIController.updateUIBasedOnWorkStatus();
        }
        
        // 更新统计信息
        if (StatsController && typeof StatsController.updateStats === 'function') {
            StatsController.updateStats();
        }
        
        // 显示保存成功提示
        UIController.showToast('设置已保存');
        
        // 切换回打卡页面
        UIController.tabSwitch('checkin');
    },

    // ... 省略其他方法
}; 