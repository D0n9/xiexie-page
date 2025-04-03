/**
 * UI控制器
 * 管理用户界面元素和交互
 */

const UIController = {
    // 页面元素引用
    elements: {
        // 当前日期显示
        currentDate: document.getElementById('current-date'),
        
        // 标签页按钮和内容
        tabButtons: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // 打卡界面
        statusIcon: document.getElementById('status-icon'),
        statusText: document.getElementById('status-text'),
        timeDisplay: document.getElementById('time-display'),
        timeCircle: document.querySelector('.w-56.h-56.rounded-full'),
        clockInBtn: document.getElementById('clock-in-btn'),
        clockOutBtn: document.getElementById('clock-out-btn'),
        
        // 今日记录
        clockInTime: document.getElementById('clock-in-time'),
        clockOutTime: document.getElementById('clock-out-time'),
        workDuration: document.getElementById('work-duration'),
        overtimeContainer: document.getElementById('overtime-container'),
        overtimeDuration: document.getElementById('overtime-duration'),
        
        // 倒计时
        countdownDisplay: document.getElementById('countdown-display'),
        countdownMessage: document.getElementById('countdown-message')
    },
    
    // 工时检查计时器ID
    workHoursCheckerId: null,
    
    /**
     * 初始化UI控制器
     */
    init() {
        // 显示当前日期
        this.updateCurrentDate();
        
        // 设置标签页切换事件
        this.setupTabSwitching();
        
        // 设置打卡按钮事件
        this.setupClockEvents();
        
        // 设置时间编辑事件
        this.setupTimeEditEvents();
        
        // 根据当前工作状态更新UI
        this.updateUIBasedOnWorkStatus();
    },
    
    /**
     * 更新当前日期显示
     */
    updateCurrentDate() {
        const now = new Date();
        const dateStr = Utils.formatDate(now);
        const dayOfWeek = Utils.getDayOfWeek(now);
        this.elements.currentDate.textContent = `${dateStr} ${dayOfWeek}`;
    },
    
    /**
     * 设置标签页切换事件
     */
    setupTabSwitching() {
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.tabSwitch(button.id.replace('tab-', ''));
            });
        });
    },
    
    /**
     * 设置打卡按钮事件
     */
    setupClockEvents() {
        // 上班打卡
        this.elements.clockInBtn.addEventListener('click', () => {
            const startTime = TimerService.clockIn();
            this.updateClockInUI(startTime);
        });
        
        // 下班打卡
        this.elements.clockOutBtn.addEventListener('click', () => {
            const endTime = TimerService.clockOut();
            this.updateClockOutUI(endTime);
            
            // 下班后立即更新统计数据，确保统计页面显示最新数据
            StatsController.updateStats();
        });
    },
    
    /**
     * 设置时间编辑事件
     */
    setupTimeEditEvents() {
        // 上班时间编辑按钮
        document.getElementById('edit-clock-in-btn').addEventListener('click', () => {
            this.showTimeEditControls('in');
        });
        
        // 下班时间编辑按钮
        document.getElementById('edit-clock-out-btn').addEventListener('click', () => {
            this.showTimeEditControls('out');
        });
        
        // 保存修改按钮
        document.getElementById('save-time-edits-btn').addEventListener('click', () => {
            this.saveTimeEdits();
        });
    },
    
    /**
     * 显示时间编辑控件
     * @param {string} type - 编辑类型 ('in' 或 'out')
     */
    showTimeEditControls(type) {
        const saveBtn = document.getElementById('save-time-edits-btn');
        saveBtn.classList.remove('hidden');
        
        if (type === 'in') {
            // 显示上班时间编辑控件
            const inTimeContainer = document.getElementById('clock-in-edit-container');
            const inTimeInput = document.getElementById('clock-in-time-input');
            const currentInTime = document.getElementById('clock-in-time').textContent;
            
            // 如果已经有时间，设置为输入框的默认值
            if (currentInTime !== '未打卡') {
                // 假设时间格式为 HH:MM:SS，转换为 HH:MM 格式（input type="time" 需要）
                const timeComponents = currentInTime.split(':');
                const formattedTime = `${timeComponents[0]}:${timeComponents[1]}:${timeComponents[2] || '00'}`;
                inTimeInput.value = formattedTime;
            } else {
                // 如果未打卡，默认设为当前时间
                const now = new Date();
                inTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            }
            
            // 显示编辑控件，隐藏显示文本
            inTimeContainer.classList.remove('hidden');
            document.getElementById('clock-in-time').classList.add('hidden');
            document.getElementById('edit-clock-in-btn').classList.add('hidden');
        } else if (type === 'out') {
            // 显示下班时间编辑控件
            const outTimeContainer = document.getElementById('clock-out-edit-container');
            const outTimeInput = document.getElementById('clock-out-time-input');
            const currentOutTime = document.getElementById('clock-out-time').textContent;
            
            // 如果已经有时间，设置为输入框的默认值
            if (currentOutTime !== '未打卡') {
                // 假设时间格式为 HH:MM:SS，转换为 HH:MM 格式
                const timeComponents = currentOutTime.split(':');
                const formattedTime = `${timeComponents[0]}:${timeComponents[1]}:${timeComponents[2] || '00'}`;
                outTimeInput.value = formattedTime;
            } else {
                // 如果未打卡，默认设为当前时间
                const now = new Date();
                outTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            }
            
            // 显示编辑控件，隐藏显示文本
            outTimeContainer.classList.remove('hidden');
            document.getElementById('clock-out-time').classList.add('hidden');
            document.getElementById('edit-clock-out-btn').classList.add('hidden');
        }
    },
    
    /**
     * 隐藏时间编辑控件
     */
    hideTimeEditControls() {
        // 隐藏所有编辑控件
        document.getElementById('clock-in-edit-container').classList.add('hidden');
        document.getElementById('clock-out-edit-container').classList.add('hidden');
        document.getElementById('save-time-edits-btn').classList.add('hidden');
        
        // 显示所有时间显示和编辑按钮
        document.getElementById('clock-in-time').classList.remove('hidden');
        document.getElementById('clock-out-time').classList.remove('hidden');
        document.getElementById('edit-clock-in-btn').classList.remove('hidden');
        document.getElementById('edit-clock-out-btn').classList.remove('hidden');
    },
    
    /**
     * 保存时间编辑
     */
    saveTimeEdits() {
        const today = new Date();
        const dateStr = Utils.formatDate(today);
        let inTimeChanged = false;
        let outTimeChanged = false;
        
        // 检查上班时间是否在编辑
        const inTimeContainer = document.getElementById('clock-in-edit-container');
        if (!inTimeContainer.classList.contains('hidden')) {
            const inTimeInput = document.getElementById('clock-in-time-input');
            const inTimeValue = inTimeInput.value;
            
            if (inTimeValue) {
                // 创建上班时间的Date对象（使用今天的日期）
                const [hours, minutes, seconds] = inTimeValue.split(':').map(Number);
                const newInTime = new Date(today);
                newInTime.setHours(hours, minutes, seconds || 0, 0);
                
                // 记录原始上班时间以便在统计中查找匹配记录
                const originalStartTime = TimerService.workStartTime ? TimerService.workStartTime.getTime() : null;
                
                // 更新TimerService中的上班时间
                TimerService.updateWorkStartTime(newInTime);
                inTimeChanged = true;
                
                // 记录这是一次手动编辑
                TimerService.lastTimeEditInfo = {
                    type: 'start',
                    originalTime: originalStartTime,
                    newTime: newInTime.getTime(),
                    timestamp: Date.now()
                };
            }
        }
        
        // 检查下班时间是否在编辑
        const outTimeContainer = document.getElementById('clock-out-edit-container');
        if (!outTimeContainer.classList.contains('hidden')) {
            const outTimeInput = document.getElementById('clock-out-time-input');
            const outTimeValue = outTimeInput.value;
            
            if (outTimeValue) {
                // 创建下班时间的Date对象（使用今天的日期）
                const [hours, minutes, seconds] = outTimeValue.split(':').map(Number);
                const newOutTime = new Date(today);
                newOutTime.setHours(hours, minutes, seconds || 0, 0);
                
                // 记录原始下班时间以便在统计中查找匹配记录
                const originalEndTime = TimerService.workEndTime ? TimerService.workEndTime.getTime() : null;
                
                // 更新TimerService中的下班时间
                TimerService.updateWorkEndTime(newOutTime);
                outTimeChanged = true;
                
                // 记录这是一次手动编辑
                TimerService.lastTimeEditInfo = {
                    type: 'end',
                    originalTime: originalEndTime,
                    newTime: newOutTime.getTime(),
                    timestamp: Date.now()
                };
            }
        }
        
        // 如果有时间被修改，重新计算工作记录
        if (inTimeChanged || outTimeChanged) {
            // 更新工作记录
            TimerService.recalculateWorkRecord();
            
            // 更新UI显示
            if (TimerService.workStatus === CONFIG.STATUS.WORKING) {
                if (TimerService.workStartTime) {
                    this.updateClockInUI(TimerService.workStartTime);
                }
            } else if (TimerService.workStatus === CONFIG.STATUS.COMPLETED) {
                if (TimerService.workStartTime) {
                    this.updateClockInUI(TimerService.workStartTime);
                }
                if (TimerService.workEndTime) {
                    this.updateClockOutUI(TimerService.workEndTime);
                }
            }
        }
        
        // 隐藏编辑控件
        this.hideTimeEditControls();
    },
    
    /**
     * 根据当前工作状态更新UI
     */
    updateUIBasedOnWorkStatus() {
        const status = TimerService.workStatus;
        
        // 更新状态图标和文本
        if (status === CONFIG.STATUS.WORKING) {
            // 工作中状态
            this.updateWorkingStatusUI();
            
            // 更新上班时间显示 - 使用实际打卡时间
            if (TimerService.realClockInTime) {
                this.updateClockInUI(TimerService.realClockInTime);
            } else if (TimerService.workStartTime) {
                // 兼容旧数据，如果没有realClockInTime就使用workStartTime
                this.updateClockInUI(TimerService.workStartTime);
            }
            
            // 确保下班时间显示为未打卡
            this.elements.clockOutTime.textContent = '未打卡';
            document.getElementById('edit-clock-out-btn').classList.add('hidden');
            
            // 确保根据当前工时正确应用样式
            this.updateWorkingAnimationBasedOnHours();
        } else if (status === CONFIG.STATUS.COMPLETED) {
            // 已下班状态
            this.updateCompletedStatusUI();
            
            // 更新上班和下班时间显示
            if (TimerService.realClockInTime) {
                this.updateClockInUI(TimerService.realClockInTime);
            } else if (TimerService.workStartTime) {
                // 兼容旧数据
                this.updateClockInUI(TimerService.workStartTime);
            }
            
            if (TimerService.workEndTime) {
                this.updateClockOutUI(TimerService.workEndTime);
            }
        } else {
            // 未上班状态
            this.updateIdleStatusUI();
            
            // 检查今日是否有历史工作记录
            this.updateTodayHistory();
        }
    },
    
    /**
     * 更新今日历史工作记录显示
     */
    updateTodayHistory() {
        const today = new Date();
        const dateStr = Utils.formatDate(today);
        const todayRecords = Store.getDailyRecord(dateStr);
        
        if (!todayRecords) return;
        
        // 计算总工作时长
        const workDuration = TimerService.calculateTodayWorkDuration();
        this.elements.workDuration.textContent = Utils.formatWorkDuration(workDuration.hours, workDuration.minutes);
        
        // 计算并显示加班时长（如果有）
        // 使用标准工作时间来计算加班时长，而不是使用固定的8小时
        const expectedDuration = TimerService.calculateExpectedWorkDuration();
        const totalWorkMinutes = workDuration.hours * 60 + workDuration.minutes;
        const expectedWorkMinutes = expectedDuration.hours * 60 + expectedDuration.minutes;
        
        // 只有当实际工作时间超过预期工作时间时，才显示加班
        if (totalWorkMinutes > expectedWorkMinutes) {
            const overtimeMinutes = totalWorkMinutes - expectedWorkMinutes;
            const overtimeHours = Math.floor(overtimeMinutes / 60);
            const overtimeMinutesRemainder = overtimeMinutes % 60;
            
            this.elements.overtimeDuration.textContent = Utils.formatWorkDuration(overtimeHours, overtimeMinutesRemainder);
            this.elements.overtimeContainer.style.display = 'flex';
        } else {
            this.elements.overtimeContainer.style.display = 'none';
        }
        
        // 显示最近一次打卡时间
        if (Array.isArray(todayRecords)) {
            // 获取最近一次记录
            const latestRecord = todayRecords[todayRecords.length - 1];
            this.elements.clockInTime.textContent = Utils.formatTime(new Date(latestRecord.startTime));
            this.elements.clockOutTime.textContent = Utils.formatTime(new Date(latestRecord.endTime));
        } else {
            // 单条记录
            this.elements.clockInTime.textContent = Utils.formatTime(new Date(todayRecords.startTime));
            this.elements.clockOutTime.textContent = Utils.formatTime(new Date(todayRecords.endTime));
        }
    },
    
    /**
     * 更新上班打卡后的UI
     * @param {Date} startTime - 上班时间
     */
    updateClockInUI(startTime) {
        // 更新状态为工作中
        this.updateWorkingStatusUI();
        
        // 显示实际打卡时间（传入的是realClockInTime）
        this.elements.clockInTime.textContent = Utils.formatTime(startTime);
        
        // 当重新打卡上班时，清空下班时间显示
        if (TimerService.workEndTime === null) {
            this.elements.clockOutTime.textContent = '未打卡';
            document.getElementById('edit-clock-out-btn').classList.add('hidden');
        }
        
        // 显示编辑按钮
        document.getElementById('edit-clock-in-btn').classList.remove('hidden');
        
        // 启用下班按钮，禁用上班按钮
        this.elements.clockInBtn.disabled = true;
        this.elements.clockInBtn.classList.remove('bg-primary');
        this.elements.clockInBtn.classList.add('bg-gray-300');
        this.elements.clockInBtn.classList.remove('text-white');
        this.elements.clockInBtn.classList.add('text-gray-600');
        
        this.elements.clockOutBtn.disabled = false;
        this.elements.clockOutBtn.classList.remove('bg-gray-300');
        this.elements.clockOutBtn.classList.add('bg-primary');
        this.elements.clockOutBtn.classList.remove('text-gray-600');
        this.elements.clockOutBtn.classList.add('text-white');
        
        // 移除可能的已完成状态(绿色)边框
        this.elements.timeCircle.classList.remove('border-green-500');
        
        // 根据当前工作时长更新圆圈颜色
        this.updateWorkingAnimationBasedOnHours();
        
        // Start the timer
        TimerService.startTimer();
    },
    
    /**
     * 更新下班打卡后的UI
     * @param {Date} endTime - 下班时间
     */
    updateClockOutUI(endTime) {
        // 更新状态为已完成
        this.updateCompletedStatusUI();
        
        // 显示下班时间
        this.elements.clockOutTime.textContent = Utils.formatTime(endTime);
        
        // 显示编辑按钮
        document.getElementById('edit-clock-out-btn').classList.remove('hidden');
        
        // 计算并显示工作时长
        const workDuration = TimerService.calculateTodayWorkDuration();
        this.elements.workDuration.textContent = Utils.formatWorkDuration(workDuration.hours, workDuration.minutes);
        
        // 计算并显示加班时长（如果有）
        // 使用标准工作时间来计算加班时长，而不是使用固定的8小时
        const expectedDuration = TimerService.calculateExpectedWorkDuration();
        const totalWorkMinutes = workDuration.hours * 60 + workDuration.minutes;
        const expectedWorkMinutes = expectedDuration.hours * 60 + expectedDuration.minutes;
        
        // 只有当实际工作时间超过预期工作时间时，才显示加班
        if (totalWorkMinutes > expectedWorkMinutes) {
            const overtimeMinutes = totalWorkMinutes - expectedWorkMinutes;
            const overtimeHours = Math.floor(overtimeMinutes / 60);
            const overtimeMinutesRemainder = overtimeMinutes % 60;
            
            this.elements.overtimeDuration.textContent = Utils.formatWorkDuration(overtimeHours, overtimeMinutesRemainder);
            this.elements.overtimeContainer.style.display = 'flex';
        } else {
            this.elements.overtimeContainer.style.display = 'none';
        }
        
        // 启用上班按钮，禁用下班按钮
        this.elements.clockInBtn.disabled = false;
        this.elements.clockInBtn.classList.remove('bg-gray-300');
        this.elements.clockInBtn.classList.add('bg-primary');
        this.elements.clockInBtn.classList.remove('text-gray-600');
        this.elements.clockInBtn.classList.add('text-white');
        
        this.elements.clockOutBtn.disabled = true;
        this.elements.clockOutBtn.classList.add('bg-gray-300');
        this.elements.clockOutBtn.classList.remove('bg-primary');
        this.elements.clockOutBtn.classList.add('text-gray-600');
        this.elements.clockOutBtn.classList.remove('text-white');
        
        // 设置下班状态的圆圈颜色为绿色
        this.elements.timeCircle.classList.remove('border-primary');
        this.elements.timeCircle.classList.remove('border-overtime-1');
        this.elements.timeCircle.classList.remove('border-overtime-2');
        this.elements.timeCircle.classList.add('border-green-500');
        
        // 更新倒计时显示
        this.elements.countdownDisplay.textContent = '已下班';
        this.elements.countdownMessage.textContent = '可以再次打卡开始新的工作时段';
    },
    
    /**
     * 更新为工作中状态的UI
     */
    updateWorkingStatusUI() {
        // 更新状态图标和文字
        this.elements.statusIcon.innerHTML = '<i class="ri-time-line"></i>';
        this.elements.statusText.textContent = CONFIG.UI_TEXT.WORKING;
        
        // 移除完成状态的绿色边框
        this.elements.timeCircle.classList.remove('border-green-500');
        
        // 检查是否超过了标准工时
        this.updateWorkingAnimationBasedOnHours();
        
        // 每分钟检查工时状态并更新样式
        this.startWorkHoursChecker();
    },
    
    /**
     * 检查工作时长并根据工时更新UI动画效果
     */
    updateWorkingAnimationBasedOnHours() {
        // 使用当天总工作时长来确定圆圈颜色
        const workDuration = TimerService.calculateTodayWorkDuration();
        const hours = workDuration.hours + (workDuration.minutes / 60);
        
        // 移除所有可能的样式类
        this.elements.statusIcon.classList.remove(
            'working-status', 
            'overtime-working-status',
            'overtime-working-status-1',
            'overtime-working-status-2',
            'overtime-working-status-3',
            'overtime-working-status-4'
        );
        
        this.elements.statusText.classList.remove(
            'working-status', 
            'overtime-working-status',
            'overtime-working-status-1',
            'overtime-working-status-2',
            'overtime-working-status-3',
            'overtime-working-status-4'
        );
        
        this.elements.timeDisplay.parentElement.classList.remove(
            'pulse-animation', 
            'overtime-pulse-animation',
            'overtime-pulse-animation-1',
            'overtime-pulse-animation-2',
            'overtime-pulse-animation-3',
            'overtime-pulse-animation-4'
        );
        
        // 移除所有可能的边框颜色类
        this.elements.timeCircle.classList.remove(
            'border-primary',
            'border-overtime-1',
            'border-overtime-2',
            'border-overtime-3',
            'border-overtime-4',
            'border-green-500'
        );
        
        // 根据工作时长设置不同的样式
        if (hours < CONFIG.WORK_HOURS.STANDARD_HOURS) {
            // 正常工作时间，使用标准蓝色脉冲
            this.elements.statusIcon.classList.add('working-status');
            this.elements.statusText.classList.add('working-status');
            this.elements.timeDisplay.parentElement.classList.add('pulse-animation');
            this.elements.timeCircle.classList.add('border-primary');
        } else if (hours >= CONFIG.WORK_HOURS.STANDARD_HOURS && hours < 9) {
            // 8-9小时，使用淡红色（黄色）脉冲
            this.elements.statusIcon.classList.add('overtime-working-status-1');
            this.elements.statusText.classList.add('overtime-working-status-1');
            this.elements.timeDisplay.parentElement.classList.add('overtime-pulse-animation-1');
            this.elements.timeCircle.classList.add('border-overtime-1');
        } else if (hours >= 9 && hours < 10) {
            // 9-10小时，使用淡红色脉冲
            this.elements.statusIcon.classList.add('overtime-working-status-2');
            this.elements.statusText.classList.add('overtime-working-status-2');
            this.elements.timeDisplay.parentElement.classList.add('overtime-pulse-animation-2');
            this.elements.timeCircle.classList.add('border-overtime-2');
        } else if (hours >= 10 && hours < 12) {
            // 10-12小时，使用红色脉冲
            this.elements.statusIcon.classList.add('overtime-working-status-3');
            this.elements.statusText.classList.add('overtime-working-status-3');
            this.elements.timeDisplay.parentElement.classList.add('overtime-pulse-animation-3');
            this.elements.timeCircle.classList.add('border-overtime-3');
        } else {
            // 12小时以上，使用深红色脉冲
            this.elements.statusIcon.classList.add('overtime-working-status-4');
            this.elements.statusText.classList.add('overtime-working-status-4');
            this.elements.timeDisplay.parentElement.classList.add('overtime-pulse-animation-4');
            this.elements.timeCircle.classList.add('border-overtime-4');
        }
    },
    
    /**
     * 启动工时检查器，每分钟检查一次工时并更新UI样式
     */
    startWorkHoursChecker() {
        // 清除可能存在的旧计时器
        if (this.workHoursCheckerId) {
            clearInterval(this.workHoursCheckerId);
        }
        
        // 设置新的计时器，每分钟检查一次
        this.workHoursCheckerId = setInterval(() => {
            if (TimerService.workStatus === CONFIG.STATUS.WORKING) {
                this.updateWorkingAnimationBasedOnHours();
            } else {
                // 如果不再处于工作状态，停止检查
                clearInterval(this.workHoursCheckerId);
                this.workHoursCheckerId = null;
            }
        }, 60000); // 每分钟检查一次
    },
    
    /**
     * 更新为已完成状态的UI
     */
    updateCompletedStatusUI() {
        // 更新状态图标和文字
        this.elements.statusIcon.innerHTML = '<i class="ri-check-line"></i>';
        this.elements.statusText.textContent = CONFIG.UI_TEXT.COMPLETED;
        
        // 添加已完成状态样式
        this.elements.statusIcon.classList.remove(
            'working-status', 
            'overtime-working-status',
            'overtime-working-status-1',
            'overtime-working-status-2',
            'overtime-working-status-3',
            'overtime-working-status-4'
        );
        
        this.elements.statusText.classList.remove(
            'working-status', 
            'overtime-working-status',
            'overtime-working-status-1',
            'overtime-working-status-2',
            'overtime-working-status-3',
            'overtime-working-status-4'
        );
        
        this.elements.statusIcon.classList.add('completed-status');
        this.elements.statusText.classList.add('completed-status');
        
        // 移除时钟动画效果
        this.elements.timeDisplay.parentElement.classList.remove(
            'pulse-animation', 
            'overtime-pulse-animation',
            'overtime-pulse-animation-1',
            'overtime-pulse-animation-2',
            'overtime-pulse-animation-3',
            'overtime-pulse-animation-4'
        );
        
        // 将时钟边框恢复为完成状态的绿色
        this.elements.timeCircle.classList.remove(
            'border-primary',
            'border-overtime-1',
            'border-overtime-2',
            'border-overtime-3',
            'border-overtime-4'
        );
        this.elements.timeCircle.classList.add('border-green-500');
        
        // 清除工时检查计时器
        if (this.workHoursCheckerId) {
            clearInterval(this.workHoursCheckerId);
            this.workHoursCheckerId = null;
        }
    },
    
    /**
     * 更新为未上班状态的UI
     */
    updateIdleStatusUI() {
        // 更新状态图标和文字
        this.elements.statusIcon.innerHTML = '<i class="ri-briefcase-line"></i>';
        this.elements.statusText.textContent = CONFIG.UI_TEXT.IDLE;
        
        // 恢复默认样式
        this.elements.statusIcon.classList.remove(
            'working-status', 
            'overtime-working-status',
            'overtime-working-status-1',
            'overtime-working-status-2',
            'overtime-working-status-3',
            'overtime-working-status-4',
            'completed-status'
        );
        
        this.elements.statusText.classList.remove(
            'working-status', 
            'overtime-working-status',
            'overtime-working-status-1',
            'overtime-working-status-2',
            'overtime-working-status-3',
            'overtime-working-status-4',
            'completed-status'
        );
        
        // 移除时钟动画效果
        this.elements.timeDisplay.parentElement.classList.remove(
            'pulse-animation', 
            'overtime-pulse-animation',
            'overtime-pulse-animation-1',
            'overtime-pulse-animation-2',
            'overtime-pulse-animation-3',
            'overtime-pulse-animation-4'
        );
        
        // 重置时钟边框颜色
        this.elements.timeCircle.classList.remove(
            'border-overtime-1',
            'border-overtime-2',
            'border-overtime-3',
            'border-overtime-4'
        );
        this.elements.timeCircle.classList.add('border-primary');
        
        // 重置时间显示
        this.elements.timeDisplay.textContent = '00:00:00';
        
        // 启用上班按钮，禁用下班按钮
        this.elements.clockInBtn.disabled = false;
        this.elements.clockInBtn.classList.remove('bg-gray-300');
        this.elements.clockInBtn.classList.add('bg-primary');
        this.elements.clockInBtn.classList.remove('text-gray-600');
        this.elements.clockInBtn.classList.add('text-white');
        
        this.elements.clockOutBtn.disabled = true;
        this.elements.clockOutBtn.classList.add('bg-gray-300');
        this.elements.clockOutBtn.classList.remove('bg-primary');
        this.elements.clockOutBtn.classList.add('text-gray-600');
        this.elements.clockOutBtn.classList.remove('text-white');
        
        // 重置记录显示
        this.elements.clockInTime.textContent = '未打卡';
        this.elements.clockOutTime.textContent = '未打卡';
        this.elements.workDuration.textContent = '0小时0分钟';
        this.elements.overtimeContainer.style.display = 'none';
        
        // 隐藏编辑按钮
        document.getElementById('edit-clock-in-btn').classList.add('hidden');
        document.getElementById('edit-clock-out-btn').classList.add('hidden');
        
        // 重置倒计时显示
        this.elements.countdownDisplay.textContent = '--:--:--';
        this.elements.countdownMessage.textContent = '请先打卡上班';
        
        // 清除工时检查计时器
        if (this.workHoursCheckerId) {
            clearInterval(this.workHoursCheckerId);
            this.workHoursCheckerId = null;
        }
    },
    
    /**
     * 标签页切换
     * @param {string} tabId 标签页ID
     */
    tabSwitch(tabId) {
        const allTabs = this.elements.tabButtons;
        const allContents = this.elements.tabContents;
        
        // 查找目标标签和内容
        const targetTab = document.getElementById(`tab-${tabId}`);
        const targetContent = document.getElementById(`${tabId}-content`);
        
        if (!targetTab || !targetContent) return;
        
        // 隐藏所有内容，取消所有标签选中状态
        allTabs.forEach(tab => {
            tab.classList.remove('active', 'bg-white', 'text-primary');
            tab.classList.add('text-gray-600');
        });
        
        allContents.forEach(content => {
            // 添加淡出效果
            content.classList.add('opacity-0', 'scale-95');
            content.classList.remove('opacity-100', 'scale-100');
            
            // 延迟隐藏元素以允许动画完成
            setTimeout(() => {
                content.classList.add('hidden');
            }, 150);
        });
        
        // 活跃标签样式
        targetTab.classList.add('active', 'bg-white', 'text-primary');
        targetTab.classList.remove('text-gray-600');
        
        // 显示目标内容
        setTimeout(() => {
            targetContent.classList.remove('hidden');
            
            // 强制回流，准备动画
            window.getComputedStyle(targetContent).opacity;
            
            // 添加淡入效果
            targetContent.classList.add('opacity-100', 'scale-100');
            targetContent.classList.remove('opacity-0', 'scale-95');
        }, 200);
        
        // 保存当前标签
        this.currentTab = tabId;
        
        // 更新数据
        if (tabId === 'stats') {
            // 更新统计数据
            StatsController.updateStats();
        } else if (tabId === 'settings') {
            // 更新设置页面内容
            SettingsController.renderSettings();
        }
        
        // 在小屏幕上自动滚动到顶部
        if (window.innerWidth < 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },
    
    /**
     * 应用主题
     */
    applyTheme() {
        // 应用暗黑模式
        const darkMode = UserPreferences.getDarkMode();
        const themeColor = UserPreferences.getThemeColor() || 'indigo';
        
        // 处理暗黑模式
        if (darkMode) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
        }
        
        // 设置主题颜色
        document.documentElement.dataset.theme = themeColor;
        
        // 设置主题色变量
        const colors = {
            'indigo': {
                primary: '#6366F1', // indigo-500
                primaryDark: '#4F46E5', // indigo-600
                primaryLight: '#E0E7FF', // indigo-100
            },
            'blue': {
                primary: '#3B82F6', // blue-500
                primaryDark: '#2563EB', // blue-600
                primaryLight: '#DBEAFE', // blue-100
            },
            'red': {
                primary: '#EF4444', // red-500
                primaryDark: '#DC2626', // red-600
                primaryLight: '#FEE2E2', // red-100
            },
            'green': {
                primary: '#10B981', // green-500
                primaryDark: '#059669', // green-600
                primaryLight: '#D1FAE5', // green-100
            },
            'purple': {
                primary: '#8B5CF6', // purple-500
                primaryDark: '#7C3AED', // purple-600
                primaryLight: '#EDE9FE', // purple-100
            }
        };
        
        // 获取当前主题色
        const currentTheme = colors[themeColor] || colors.indigo;
        
        // 设置CSS变量
        document.documentElement.style.setProperty('--color-primary', currentTheme.primary);
        document.documentElement.style.setProperty('--color-primary-dark', currentTheme.primaryDark);
        document.documentElement.style.setProperty('--color-primary-light', currentTheme.primaryLight);
    },
    
    /**
     * 应用字体大小
     */
    applyFontSize() {
        const fontSize = UserPreferences.getFontSize() || 'medium';
        const fontSizes = {
            'small': {
                base: '14px',
                lg: '16px',
                xl: '18px',
                '2xl': '20px',
            },
            'medium': {
                base: '16px',
                lg: '18px',
                xl: '20px',
                '2xl': '24px',
            },
            'large': {
                base: '18px',
                lg: '20px',
                xl: '24px',
                '2xl': '28px',
            }
        };
        
        // 获取字体大小设置
        const currentSize = fontSizes[fontSize] || fontSizes.medium;
        
        // 设置CSS变量
        document.documentElement.style.setProperty('--font-size-base', currentSize.base);
        document.documentElement.style.setProperty('--font-size-lg', currentSize.lg);
        document.documentElement.style.setProperty('--font-size-xl', currentSize.xl);
        document.documentElement.style.setProperty('--font-size-2xl', currentSize['2xl']);
        
        // 添加字体大小类
        document.body.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
        document.body.classList.add(`text-size-${fontSize}`);
    },
    
    /**
     * 显示Toast提示
     */
    showToast(message, duration = 3000) {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 opacity-0';
        toast.textContent = message;
        
        // 添加到body
        document.body.appendChild(toast);
        
        // 强制回流后显示
        setTimeout(() => {
            toast.classList.remove('opacity-0');
            toast.classList.add('opacity-100');
        }, 10);
        
        // 设置定时器移除
        setTimeout(() => {
            toast.classList.remove('opacity-100');
            toast.classList.add('opacity-0');
            
            // 完全消失后删除元素
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    },
    
    /**
     * 更新工作时间圆环
     * 用于设置变更后更新UI显示
     */
    updateWorkCircle() {
        // 获取当前工作状态
        const status = TimerService.workStatus;
        
        // 重新计算和更新工作时间显示
        if (status === CONFIG.STATUS.WORKING) {
            // 如果当前正在工作，更新工作时间显示
            this.updateWorkingStatusUI();
            this.updateWorkingAnimationBasedOnHours();
        } else if (status === CONFIG.STATUS.COMPLETED) {
            // 如果已完成工作，更新显示
            this.updateCompletedStatusUI();
        }
        
        // 更新今日历史记录显示
        this.updateTodayHistory();
    }
};