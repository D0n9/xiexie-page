/**
 * 用户偏好设置模块
 * 管理用户自定义配置，如工作时间等
 */

const UserPreferences = {
    /**
     * 存储键
     */
    STORAGE_KEY: 'userPreferences',
    
    /**
     * 默认偏好设置
     */
    DEFAULT_PREFERENCES: {
        darkMode: false,
        themeColor: 'indigo',
        fontSize: 'medium',
    },
    
    /**
     * 获取所有用户偏好
     */
    getPreferences() {
        try {
            const preferences = localStorage.getItem(this.STORAGE_KEY);
            return preferences ? JSON.parse(preferences) : { ...this.DEFAULT_PREFERENCES };
        } catch (error) {
            console.error('获取用户偏好失败:', error);
            return { ...this.DEFAULT_PREFERENCES };
        }
    },
    
    /**
     * 保存所有用户偏好
     */
    savePreferences(prefs) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
        } catch (error) {
            console.error('保存用户偏好失败:', error);
        }
    },
    
    /**
     * 获取深色模式状态
     */
    getDarkMode() {
        return this.getPreferences().darkMode;
    },
    
    /**
     * 设置深色模式状态
     */
    setDarkMode(enabled) {
        const prefs = this.getPreferences();
        prefs.darkMode = enabled;
        this.savePreferences(prefs);
    },
    
    /**
     * 获取主题颜色
     */
    getThemeColor() {
        return this.getPreferences().themeColor;
    },
    
    /**
     * 设置主题颜色
     */
    setThemeColor(color) {
        const prefs = this.getPreferences();
        prefs.themeColor = color;
        this.savePreferences(prefs);
    },
    
    /**
     * 获取字体大小
     */
    getFontSize() {
        return this.getPreferences().fontSize;
    },
    
    /**
     * 设置字体大小
     */
    setFontSize(size) {
        const prefs = this.getPreferences();
        prefs.fontSize = size;
        this.savePreferences(prefs);
    },
    
    /**
     * 初始化用户偏好设置
     */
    init() {
        // 检查是否是首次访问
        const isFirstVisit = Store.get(CONFIG.STORAGE_KEYS.FIRST_VISIT, true);
        
        if (isFirstVisit) {
            // 首次访问，显示工作时间设置弹窗
            this.showWorkHoursModal();
            // 标记为非首次访问
            Store.save(CONFIG.STORAGE_KEYS.FIRST_VISIT, false);
        } else {
            // 非首次访问，加载用户工作时间设置
            this.loadUserWorkHours();
        }
        
        // 添加设置按钮到UI
        this.addSettingsButton();
    },
    
    /**
     * 添加设置按钮到UI
     */
    addSettingsButton() {
        // 创建设置按钮
        const settingsButton = document.createElement('button');
        settingsButton.className = 'fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none';
        settingsButton.innerHTML = '<i class="ri-settings-3-line text-gray-700 text-xl"></i>';
        settingsButton.title = '调整工作时间设置';
        
        // 绑定点击事件
        settingsButton.addEventListener('click', () => {
            this.showWorkHoursModal(true);
        });
        
        // 添加到页面
        document.body.appendChild(settingsButton);
    },
    
    /**
     * 显示工作时间设置弹窗
     * @param {boolean} isEdit - 是否为编辑模式
     */
    showWorkHoursModal(isEdit = false) {
        // 创建弹窗元素
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'work-hours-modal';
        
        // 获取当前设置的值
        const currentSettings = isEdit ? this.getCurrentWorkHours() : {
            standardHours: 8,
            startHour: 9,
            startMinute: 0,
            endHour: 18,
            endMinute: 0,
            excludeBreakTime: true
        };
        
        // 格式化时间为HH:MM格式
        const formatTimeValue = (hour, minute) => {
            return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        };
        
        // 创建弹窗内容
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <h2 class="text-xl font-bold mb-4">${isEdit ? '修改' : '设置'}您的工作时间</h2>
                <p class="text-gray-600 mb-6">请设置您的标准工作时间，这将用于计算加班时间。</p>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <label class="font-medium">标准工作时长</label>
                            <p class="text-xs text-gray-500">实际工作时间（扣除午休）</p>
                        </div>
                        <div class="flex items-center">
                            <input type="number" id="standard-hours" min="1" max="12" value="${currentSettings.standardHours}" 
                                   class="w-16 py-1 px-2 border border-gray-300 rounded text-center">
                            <span class="ml-2">小时</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <label class="font-medium">上班时间</label>
                        <div class="flex items-center">
                            <input type="time" id="start-time" value="${formatTimeValue(currentSettings.startHour, currentSettings.startMinute)}" 
                                   class="py-1 px-2 border border-gray-300 rounded">
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <label class="font-medium">下班时间</label>
                        <div class="flex items-center">
                            <input type="time" id="end-time" value="${formatTimeValue(currentSettings.endHour, currentSettings.endMinute)}" 
                                   class="py-1 px-2 border border-gray-300 rounded">
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <label class="font-medium">在工时计算中扣除午休时间</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="exclude-break-time" class="sr-only peer" ${currentSettings.excludeBreakTime ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    
                    <div class="bg-blue-50 p-3 rounded text-sm text-blue-800">
                        <p><i class="ri-information-line mr-1"></i> 注意：如果您的上下班时间包含午休，请在"标准工作时长"中填入扣除午休后的实际工作时间。</p>
                        <p class="mt-1">例如：上班 10:00 到下班 19:00，中间有 1 小时午休，则实际工作 8 小时。</p>
                    </div>
                </div>
                
                <div class="mt-8 flex justify-end">
                    <button id="cancel-work-hours" class="mr-3 px-4 py-2 rounded border hover:bg-gray-100">
                        取消
                    </button>
                    <button id="save-work-hours" 
                            class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">
                        保存设置
                    </button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 绑定保存按钮事件
        document.getElementById('save-work-hours').addEventListener('click', () => {
            this.saveUserWorkHours();
            modal.remove();
        });
        
        // 绑定取消按钮事件
        document.getElementById('cancel-work-hours').addEventListener('click', () => {
            modal.remove();
        });
    },
    
    /**
     * 获取当前的工作时间设置
     * @returns {Object} 当前的工作时间设置
     */
    getCurrentWorkHours() {
        return {
            standardHours: CONFIG.WORK_HOURS.STANDARD_HOURS,
            startHour: CONFIG.WORK_HOURS.START_HOUR,
            startMinute: CONFIG.WORK_HOURS.START_MINUTE,
            endHour: CONFIG.WORK_HOURS.END_HOUR,
            endMinute: CONFIG.WORK_HOURS.END_MINUTE,
            excludeBreakTime: CONFIG.EXCLUDE_BREAK_TIME
        };
    },
    
    /**
     * 保存用户工作时间设置
     */
    saveUserWorkHours() {
        const standardHours = parseInt(document.getElementById('standard-hours').value, 10) || 8;
        const startTime = document.getElementById('start-time').value || '09:00';
        const endTime = document.getElementById('end-time').value || '18:00';
        const excludeBreakTime = document.getElementById('exclude-break-time').checked;
        
        // 解析时间
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // 创建用户工作时间设置对象
        const userWorkHours = {
            standardHours,
            startHour,
            startMinute,
            endHour,
            endMinute,
            excludeBreakTime
        };
        
        // 保存到本地存储 - 同时使用 USER_WORK_HOURS 键和 app_config 配置
        Store.save(CONFIG.STORAGE_KEYS.USER_WORK_HOURS, userWorkHours);
        
        // 同时保存到 app_config 配置中，确保与设置页面的保存方式一致
        Store.saveConfig({
            standardWorkHours: standardHours,
            startHour,
            startMinute,
            endHour,
            endMinute,
            excludeBreakTime
        });
        
        // 更新全局配置
        this.updateConfigWorkHours(userWorkHours);
        
        console.log('工作时间偏好设置已保存', userWorkHours);
        
        // 更新TimerService的配置
        if (TimerService && typeof TimerService.updateConfigSettings === 'function') {
            TimerService.updateConfigSettings();
        }
        
        // 更新UI和计算，如果需要的话
        this.applyWorkHoursChanges();
        
        // 如果设置页面已经初始化，同步更新设置页面
        if (SettingsController && typeof SettingsController.updateSettings === 'function') {
            SettingsController.updateSettings();
        }
    },
    
    /**
     * 应用工作时间变更
     * 当工作时间设置发生变化时，更新相关UI和计算
     */
    applyWorkHoursChanges() {
        // 如果当前正在工作中，更新UI动画
        if (TimerService.workStatus === CONFIG.STATUS.WORKING) {
            UIController.updateWorkingAnimationBasedOnHours();
        }
        
        // 更新倒计时
        if (TimerService.workStatus === CONFIG.STATUS.WORKING && TimerService.countdownId) {
            TimerService.updateCountdown();
        }
        
        // 如果当前在统计标签页，更新显示
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const tabId = activeTab.id.replace('tab-', '');
            if (tabId === 'stats') {
                StatsController.updateStats();
            }
        }
    },
    
    /**
     * 加载用户工作时间设置
     */
    loadUserWorkHours() {
        // 尝试从配置文件加载
        const config = Store.loadConfig();
        
        // 如果配置存在且包含所需的时间设置，优先使用配置文件中的设置
        if (config && typeof config.standardWorkHours === 'number') {
            const userWorkHours = {
                standardHours: config.standardWorkHours,
                startHour: config.startHour,
                startMinute: config.startMinute,
                endHour: config.endHour,
                endMinute: config.endMinute,
                excludeBreakTime: config.excludeBreakTime
            };
            
            // 更新全局配置
            this.updateConfigWorkHours(userWorkHours);
            console.log('从配置文件加载工作时间设置', userWorkHours);
            return;
        }
        
        // 回退到使用用户偏好设置
        const userWorkHours = Store.get(CONFIG.STORAGE_KEYS.USER_WORK_HOURS);
        if (userWorkHours) {
            // 更新全局配置
            this.updateConfigWorkHours(userWorkHours);
            console.log('从用户偏好设置加载工作时间', userWorkHours);
            
            // 同时确保保存到 app_config 配置，保持两者一致
            Store.saveConfig({
                standardWorkHours: userWorkHours.standardHours,
                startHour: userWorkHours.startHour,
                startMinute: userWorkHours.startMinute,
                endHour: userWorkHours.endHour,
                endMinute: userWorkHours.endMinute,
                excludeBreakTime: userWorkHours.excludeBreakTime
            });
        }
    },
    
    /**
     * 更新全局配置中的工作时间设置
     * @param {Object} userWorkHours - 用户设置的工作时间
     */
    updateConfigWorkHours(userWorkHours) {
        CONFIG.WORK_HOURS.STANDARD_HOURS = userWorkHours.standardHours;
        CONFIG.WORK_HOURS.START_HOUR = userWorkHours.startHour;
        CONFIG.WORK_HOURS.START_MINUTE = userWorkHours.startMinute;
        CONFIG.WORK_HOURS.END_HOUR = userWorkHours.endHour;
        CONFIG.WORK_HOURS.END_MINUTE = userWorkHours.endMinute;
        CONFIG.EXCLUDE_BREAK_TIME = userWorkHours.excludeBreakTime;
    }
}; 