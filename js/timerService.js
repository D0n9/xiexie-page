/**
 * 计时器服务
 * 管理打卡时间、计时器和倒计时功能
 */

const TimerService = {
    // 计时器ID
    timerId: null,
    countdownId: null,
    workStartTime: null,
    workEndTime: null,
    workStatus: CONFIG.STATUS.IDLE,
    
    // 存储最后一次时间编辑的信息
    lastTimeEditInfo: null,
    
    // 存储真实打卡时间（用于UI显示）
    realClockInTime: null,
    
    /**
     * 初始化计时器服务
     */
    init() {
        console.log('计时器服务初始化开始');
        
        // 从本地存储加载工作状态和时间
        this.loadWorkStatus();
        
        // 加载上次编辑的时间信息
        this.lastTimeEditInfo = Store.get(CONFIG.STORAGE_KEYS.TIME_EDITS) || null;
        
        // 确保在页面加载时更新UI显示
        this.checkAndUpdateClockInDisplay();
        
        // 如果状态是工作中，但没有开始时间，重置状态
        if (this.workStatus === CONFIG.STATUS.WORKING && !this.workStartTime) {
            this.workStatus = CONFIG.STATUS.IDLE;
        }
        
        // 如果状态是已完成，但没有结束时间，重置状态
        if (this.workStatus === CONFIG.STATUS.COMPLETED && !this.workEndTime) {
            this.workStatus = CONFIG.STATUS.IDLE;
        }
        
        // 每秒更新UI
        this.startTimeTracking();
        
        // 注册localStorage事件监听
        window.addEventListener('storage', (event) => {
            if (event.key === 'workStatus') {
                console.log('检测到workStatus变化，重新加载工作状态');
                this.loadWorkStatus();
                this.checkAndUpdateClockInDisplay();
            }
        });
        
        console.log('计时器服务初始化完成，当前状态:', this.workStatus);
    },
    
    /**
     * 检查并更新打卡显示时间
     * 确保显示的是从localStorage获取的最新数据
     */
    checkAndUpdateClockInDisplay() {
        // 强制从localStorage获取最新状态
        const storedStatus = Store.getWorkStatus();
        if (storedStatus) {
            console.log('从Store获取的工作状态:', storedStatus);
            
            // 更新在UI Controller中的时间显示
            const uiController = window.UIController || {};
            if (uiController.elements && uiController.elements.clockInTime) {
                // 优先使用真实打卡时间
                if (storedStatus.realClockInTime) {
                    const realClockInTime = new Date(storedStatus.realClockInTime);
                    console.log('更新UI显示的真实打卡时间:', Utils.formatTime(realClockInTime));
                    uiController.elements.clockInTime.textContent = Utils.formatTime(realClockInTime);
                    
                    // 显示编辑按钮
                    const editBtn = document.getElementById('edit-clock-in-btn');
                    if (editBtn) editBtn.classList.remove('hidden');
                } else if (storedStatus.workStartTime) {
                    // 兼容旧数据，如果没有realClockInTime就使用workStartTime
                    const startTime = new Date(storedStatus.workStartTime);
                    console.log('更新UI显示的打卡时间(兼容):', Utils.formatTime(startTime));
                    uiController.elements.clockInTime.textContent = Utils.formatTime(startTime);
                    
                    // 显示编辑按钮
                    const editBtn = document.getElementById('edit-clock-in-btn');
                    if (editBtn) editBtn.classList.remove('hidden');
                }
            }
        }
    },
    
    /**
     * 从本地存储加载工作状态和时间
     */
    loadWorkStatus() {
        // 加载工作状态
        this.workStatus = Store.get(CONFIG.STORAGE_KEYS.WORK_STATUS, CONFIG.STATUS.IDLE);
        
        // 加载上班时间
        const startTimeStr = Store.get(CONFIG.STORAGE_KEYS.WORK_START_TIME, null);
        this.workStartTime = startTimeStr ? new Date(startTimeStr) : null;
        
        // 加载下班时间
        const endTimeStr = Store.get(CONFIG.STORAGE_KEYS.WORK_END_TIME, null);
        this.workEndTime = endTimeStr ? new Date(endTimeStr) : null;
        
        // 加载实际打卡时间 - 确保从localStorage中获取
        const realClockInTimeStr = Store.get('realClockInTime', null);
        this.realClockInTime = realClockInTimeStr ? new Date(realClockInTimeStr) : null;
        
        // 如果没有实际打卡时间但有上班时间，则使用上班时间作为实际打卡时间（兼容旧数据）
        if (!this.realClockInTime && this.workStartTime) {
            console.log('未找到实际打卡时间，使用上班时间作为兼容:', Utils.formatTime(this.workStartTime));
            this.realClockInTime = new Date(this.workStartTime);
            // 保存以便下次不需要兼容处理
            Store.saveRealClockInTime(this.realClockInTime);
        }
        
        console.log('已加载工作状态:', { 
            workStatus: this.workStatus, 
            workStartTime: this.workStartTime, 
            workEndTime: this.workEndTime,
            realClockInTime: this.realClockInTime
        });
    },
    
    /**
     * 保存工作状态和时间到本地存储
     */
    saveWorkStatus() {
        // 保存工作状态
        Store.save(CONFIG.STORAGE_KEYS.WORK_STATUS, this.workStatus);
        
        // 保存上班时间
        if (this.workStartTime) {
            Store.save(CONFIG.STORAGE_KEYS.WORK_START_TIME, this.workStartTime.toISOString());
        }
        
        // 保存下班时间
        if (this.workEndTime) {
            Store.save(CONFIG.STORAGE_KEYS.WORK_END_TIME, this.workEndTime.toISOString());
        } else {
            // 如果下班时间为空，则从存储中删除
            Store.remove(CONFIG.STORAGE_KEYS.WORK_END_TIME);
        }
    },
    
    /**
     * 开始时间跟踪
     * 根据当前工作状态启动适当的计时器
     */
    startTimeTracking() {
        console.log('开始时间跟踪，当前状态:', this.workStatus);
        
        // 根据当前状态决定要启动哪些计时器
        if (this.workStatus === CONFIG.STATUS.WORKING && this.workStartTime) {
            // 工作中状态 - 启动计时器和倒计时
            console.log('工作中状态，启动计时器和倒计时');
            this.startTimer();
            this.startCountdown();
        } else if (this.workStatus === CONFIG.STATUS.COMPLETED && this.workStartTime && this.workEndTime) {
            // 已完成状态 - 只更新一次最终工作时间
            console.log('已完成状态，更新最终工作时间');
            this.updateElapsedTime();
        }
        
        // 更新UI以反映当前状态
        UIController.updateUIBasedOnWorkStatus();
    },
    
    /**
     * 开始计时
     */
    startTimer() {
        // 立即更新一次已经过的时间，显示累计工作时长
        this.updateElapsedTime();
        
        // 设置定时器，每秒更新一次
        this.timerId = setInterval(() => {
            this.updateElapsedTime();
        }, CONFIG.TIMER_INTERVAL);
    },
    
    /**
     * 更新已经过的时间显示
     */
    updateElapsedTime() {
        if (this.workStatus === CONFIG.STATUS.WORKING && this.workStartTime) {
            // 工作中状态 - 计时器显示当天所有工作时长的累计，包括历史记录和当前会话
            // 获取当天总工作时长（不包括当前会话的秒级更新）
            const totalWorkDuration = this.calculateTodayWorkDuration();
            
            // 将总工作时长转换为秒格式
            let totalWorkSeconds = totalWorkDuration.hours * 3600 + totalWorkDuration.minutes * 60;
            
            // 为了实现秒的实时更新，需要计算当前会话的秒数部分
            const now = new Date();
            
            // 如果calculateTodayWorkDuration已经包含了当前会话的小时和分钟部分，
            // 我们需要减去当前会话的分钟和小时，然后加上精确到秒的当前会话时长
            
            // 获取当前会话的起始时间，并计算精确到秒的经过时间
            const currentSessionDateStr = Utils.formatDate(this.workStartTime);
            const todayDateStr = Utils.formatDate(now);
            
            // 只有当当前会话是今天的时候才添加秒数
            if (currentSessionDateStr === todayDateStr) {
                // 获取所有历史记录(不包含当前会话)
                const todayRecords = Store.getDailyRecord(todayDateStr);
                
                // 计算历史记录的总时长(分钟)
                let historicalMinutes = 0;
                if (todayRecords) {
                    if (Array.isArray(todayRecords)) {
                        todayRecords.forEach(record => {
                            historicalMinutes += record.workHours * 60 + record.workMinutes;
                        });
                    } else {
                        historicalMinutes = todayRecords.workHours * 60 + todayRecords.workMinutes;
                    }
                }
                
                // 将历史记录的分钟转换为秒
                const historicalSeconds = historicalMinutes * 60;
                
                // 计算当前会话的精确秒数
                const currentSessionSeconds = Math.floor((now - this.workStartTime) / 1000);
                
                // 总秒数 = 历史记录秒数 + 当前会话秒数
                totalWorkSeconds = historicalSeconds + currentSessionSeconds;
            }
            
            // 更新圆圈中的时间显示为总工作时长，包含秒数
            const totalWorkMs = totalWorkSeconds * 1000;
            document.getElementById('time-display').textContent = Utils.formatDuration(totalWorkMs);
        } else if (this.workStatus === CONFIG.STATUS.COMPLETED && this.workStartTime && this.workEndTime) {
            // 已下班状态 - 显示当天所有工作记录的累计时间
            const totalWorkDuration = this.calculateTodayWorkDuration();
            let totalWorkMs = (totalWorkDuration.hours * 3600 + totalWorkDuration.minutes * 60) * 1000;
            document.getElementById('time-display').textContent = Utils.formatDuration(totalWorkMs);
        } else {
            // 未上班状态 - 使用今日工时显示（如果有历史记录）
            // 获取当天总工作时长（包括历史记录）
            const totalWorkDuration = this.calculateTodayWorkDuration();
            
            // 将总工作时长转换为毫秒格式以用于显示（小时和分钟）
            let totalWorkMs = (totalWorkDuration.hours * 3600 + totalWorkDuration.minutes * 60) * 1000;
            
            // 更新圆圈中的时间显示为总工作时长
            document.getElementById('time-display').textContent = Utils.formatDuration(totalWorkMs);
        }
    },
    
    /**
     * 停止计时器
     */
    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    },
    
    /**
     * 上班打卡
     */
    clockIn() {
        // 如果当前状态是已下班，先重置工作会话
        if (this.workStatus === CONFIG.STATUS.COMPLETED) {
            this.resetWorkSession();
        }
        
        // 保存实际打卡时间用于UI显示 - 总是使用真实打卡时间
        this.realClockInTime = new Date();
        
        // 创建用于计算的上班时间，使用标准上班时间
        const today = new Date();
        this.workStartTime = new Date(today);
        this.workStartTime.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
        
        // 如果实际打卡时间晚于标准上班时间，则计算也使用实际打卡时间
        // 但如果早于标准上班时间，计算仍使用标准时间，UI显示使用实际时间
        if (this.realClockInTime > this.workStartTime) {
            this.workStartTime = new Date(this.realClockInTime);
            console.log('实际打卡时间晚于标准时间，使用实际时间进行计算');
        } else {
            console.log('实际打卡时间早于标准时间，UI显示实际时间，计算使用标准时间');
        }
        
        this.workStatus = CONFIG.STATUS.WORKING;
        
        // 保存到本地存储 - 确保分别保存realClockInTime和workStartTime
        Store.saveWorkStartTime(this.workStartTime);
        Store.saveWorkStatus(this.workStatus);
        Store.saveRealClockInTime(this.realClockInTime);
        
        // 启动计时器
        this.startTimer();
        
        // 启动倒计时
        this.startCountdown();
        
        // 返回上班时间以便UI更新 - 使用实际打卡时间用于显示
        return this.realClockInTime;
    },
    
    /**
     * 重置工作会话
     * 在同一天内开始新的工作会话时调用
     */
    resetWorkSession() {
        console.log('重置工作会话开始');
        
        // 停止计时器和倒计时
        this.stopTimer();
        this.stopCountdown();
        
        // 检查是否有完整的上一个会话
        const hasCompleteSession = this.workStartTime && this.workEndTime && this.workStatus === CONFIG.STATUS.COMPLETED;
        
        // 保存上一个会话记录
        if (hasCompleteSession) {
            console.log('有完整会话记录，保存之前的会话');
            this.saveWorkRecord();
        } else if (this.workStartTime && this.workStatus === CONFIG.STATUS.WORKING) {
            // 处理特殊情况：如果上一个会话处于工作中状态但未完成，需要自动完成它
            console.log('检测到未完成的会话，自动完成并保存');
            
            // 设置结束时间为当前时间
            this.workEndTime = new Date();
            this.workStatus = CONFIG.STATUS.COMPLETED;
            
            // 保存然后清理
            this.saveWorkRecord();
        }
        
        // 重置工作开始和结束时间
        this.workStartTime = null;
        this.workEndTime = null;
        this.realClockInTime = null;
        
        // 先将状态设为IDLE，以便UI正确更新
        this.workStatus = CONFIG.STATUS.IDLE;
        
        // 清除本地存储中的当前会话数据
        console.log('清除当前会话数据，重置状态为IDLE');
        Store.save(CONFIG.STORAGE_KEYS.WORK_START_TIME, null);
        Store.save(CONFIG.STORAGE_KEYS.WORK_END_TIME, null);
        Store.save(CONFIG.STORAGE_KEYS.WORK_STATUS, CONFIG.STATUS.IDLE);
        Store.save('realClockInTime', null);
        
        // 验证状态是否正确保存
        const savedStatus = Store.getWorkStatus();
        if (savedStatus !== CONFIG.STATUS.IDLE) {
            console.error('状态重置失败，重试...');
            // 重试一次
            Store.saveWorkStatus(CONFIG.STATUS.IDLE);
        }
        
        console.log('重置工作会话完成，当前状态:', this.workStatus);
    },
    
    /**
     * 下班打卡
     */
    clockOut() {
        // 如果没有上班时间，不能下班打卡
        if (!this.workStartTime) {
            console.error('无法下班打卡：缺少上班时间');
            return null;
        }
        
        // 创建下班时间并保存
        this.workEndTime = new Date();
        this.workStatus = CONFIG.STATUS.COMPLETED;
        
        // 保存到本地存储
        Store.saveWorkEndTime(this.workEndTime);
        Store.saveWorkStatus(this.workStatus);
        
        // 验证数据是否成功保存
        const savedEndTime = Store.getWorkEndTime();
        const savedStatus = Store.getWorkStatus();
        
        if (!savedEndTime || savedStatus !== CONFIG.STATUS.COMPLETED) {
            console.error('下班打卡数据保存异常，尝试重新保存');
            // 重试一次
            Store.saveWorkEndTime(this.workEndTime);
            Store.saveWorkStatus(this.workStatus);
        }
        
        // 停止倒计时
        this.stopCountdown();
        
        // 计算并保存今日工作记录
        this.saveWorkRecord();
        
        // 更新显示最终工作时间
        this.updateElapsedTime();
        
        // 在下班状态，应该停止计时器，因为不需要更新秒数
        this.stopTimer();
        
        console.log('成功下班打卡，状态已更新为：', this.workStatus);
        
        // 返回下班时间以便UI更新
        return this.workEndTime;
    },
    
    /**
     * 保存工作记录
     */
    saveWorkRecord() {
        if (!this.workStartTime || !this.workEndTime) return;
        
        const dateStr = Utils.formatDate(this.workStartTime);
        
        // 获取上下班时间之间的原始时间差
        // 确保使用 workStartTime（可能是标准上班时间）来计算工时，而不是 realClockInTime
        const rawDiff = Utils.calculateTimeDifference(this.workStartTime, this.workEndTime);
        const rawTotalMinutes = rawDiff.hours * 60 + rawDiff.minutes;
        
        // 计算标准工作时长和上下班间隔中的午休时间
        const expectedDuration = this.calculateExpectedWorkDuration();
        const expectedWorkMinutes = expectedDuration.hours * 60 + expectedDuration.minutes;
        
        // 从上下班设置计算实际上班下班之间的总时间（包含午休）
        const startDate = new Date();
        startDate.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
        
        const endDate = new Date();
        endDate.setHours(CONFIG.WORK_HOURS.END_HOUR, CONFIG.WORK_HOURS.END_MINUTE, 0, 0);
        
        // 如果跨天，调整结束时间
        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        // 计算标准上下班之间的总分钟数
        const standardTotalDiff = Utils.calculateTimeDifference(startDate, endDate);
        const standardTotalMinutes = standardTotalDiff.hours * 60 + standardTotalDiff.minutes;
        
        // 计算标准午休时间（分钟）
        const standardBreakMinutes = standardTotalMinutes - expectedWorkMinutes;
        
        // 计算实际工作时间，从原始时间差中减去午休时间（如果用户设置了扣除午休时间）
        let actualWorkMinutes = rawTotalMinutes;
        
        // 根据用户设置决定是否扣除午休时间
        if (CONFIG.EXCLUDE_BREAK_TIME) {
            // 只有当原始时间差超过标准午休时间，才减去午休时间
            if (rawTotalMinutes > standardBreakMinutes) {
                actualWorkMinutes = rawTotalMinutes - standardBreakMinutes;
            }
        }
        
        // 转换为小时和分钟
        const workHours = Math.floor(actualWorkMinutes / 60);
        const workMinutes = actualWorkMinutes % 60;
        
        // 计算加班时间
        let overtimeHours = 0;
        let overtimeMinutes = 0;
        
        if (actualWorkMinutes > expectedWorkMinutes) {
            const overtimeTotalMinutes = actualWorkMinutes - expectedWorkMinutes;
            overtimeHours = Math.floor(overtimeTotalMinutes / 60);
            overtimeMinutes = overtimeTotalMinutes % 60;
        }
        
        // 创建工作记录 - 确保状态为已完成
        const record = {
            // 保存实际打卡时间和标准计算时间
            realStartTime: this.realClockInTime ? this.realClockInTime.getTime() : this.workStartTime.getTime(),
            startTime: this.workStartTime.getTime(),
            endTime: this.workEndTime.getTime(),
            workHours: workHours,
            workMinutes: workMinutes,
            overtimeHours,
            overtimeMinutes,
            rawHours: rawDiff.hours,        // 保存原始时间差，用于调试
            rawMinutes: rawDiff.minutes,    // 保存原始时间差，用于调试
            breakMinutes: standardBreakMinutes, // 保存午休时间，用于显示
            excludedBreakTime: CONFIG.EXCLUDE_BREAK_TIME, // 记录当时的午休时间扣除设置
            status: CONFIG.STATUS.COMPLETED,  // 显式设置为已完成状态
            sessionId: Date.now()            // 添加唯一会话ID，避免重复
        };
        
        // 获取今日已有记录
        const existingRecords = Store.getDailyRecord(dateStr);
        
        // 确保我们保存为数组形式
        let recordsArray = [];
        
        if (existingRecords) {
            if (Array.isArray(existingRecords)) {
                recordsArray = [...existingRecords];
            } else {
                recordsArray = [existingRecords];
            }
        }
        
        // 检查是否有重复记录（起止时间相同的记录）
        const isDuplicate = recordsArray.some(r => 
            Math.abs(r.startTime - record.startTime) < 1000 && 
            Math.abs(r.endTime - record.endTime) < 1000
        );
        
        if (!isDuplicate) {
            recordsArray.push(record);
            
            // 按开始时间从新到旧排序
            recordsArray.sort((a, b) => b.startTime - a.startTime);
            
            // 保存到本地存储
            Store.save(CONFIG.STORAGE_KEYS.DAILY_RECORDS, {
                ...Store.getAllRecords(),
                [dateStr]: recordsArray
            });
            
            console.log('已保存工作记录', record, '今日记录总数:', recordsArray.length);
        } else {
            console.log('检测到重复记录，跳过保存');
        }
        
        // 再次确认工作状态已保存
        this.workStatus = CONFIG.STATUS.COMPLETED;
        Store.saveWorkStatus(this.workStatus);
    },
    
    /**
     * 开始倒计时
     */
    startCountdown() {
        // 立即更新一次倒计时
        this.updateCountdown();
        
        // 设置定时器，每秒更新一次
        this.countdownId = setInterval(() => {
            this.updateCountdown();
        }, CONFIG.TIMER_INTERVAL); // 每秒更新一次倒计时
    },
    
    /**
     * 更新倒计时显示
     */
    updateCountdown() {
        if (!this.workStartTime || this.workStatus !== CONFIG.STATUS.WORKING) return;
        
        const now = new Date();
        const endOfWorkDay = new Date(now);
        
        // 设置标准下班时间 - 使用配置中的工作时间
        endOfWorkDay.setHours(CONFIG.WORK_HOURS.END_HOUR, CONFIG.WORK_HOURS.END_MINUTE, 0, 0);
        
        // 如果当前时间已经超过下班时间，显示加班信息
        if (now >= endOfWorkDay) {
            // 计算加班时长 - 使用 calculateTodayOvertime 确保一致性
            const overtime = TimerService.calculateTodayOvertime();
            
            // 计算加班的秒数部分（为了显示秒数）
            const overtimeMs = now - endOfWorkDay;
            const overtimeSeconds = Math.floor((overtimeMs % (1000 * 60)) / 1000);
            
            document.getElementById('countdown-display').textContent = '加班中';
            document.getElementById('countdown-message').textContent = 
                `已加班 ${overtime.hours}小时${overtime.minutes}分钟${overtimeSeconds}秒`;
            
            // 添加加班样式
            document.getElementById('countdown-display').classList.add('overtime-status');
        } else {
            // 计算剩余时间（包括秒数）
            const diffMs = endOfWorkDay - now;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            // 格式化显示
            document.getElementById('countdown-display').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            document.getElementById('countdown-message').textContent = '距离下班还有';
            
            // 移除加班样式
            document.getElementById('countdown-display').classList.remove('overtime-status');
        }
    },
    
    /**
     * 停止倒计时
     */
    stopCountdown() {
        if (this.countdownId) {
            clearInterval(this.countdownId);
            this.countdownId = null;
        }
    },
    
    /**
     * 计算今日工作时长
     * @returns {Object} 工作时长对象，包含小时和分钟
     */
    calculateTodayWorkDuration() {
        // 获取今日已保存的工作记录
        const today = new Date();
        const dateStr = Utils.formatDate(today);
        const todayRecords = Store.getDailyRecord(dateStr);
        
        // 用于存储计算过的会话起始时间，避免重复计算
        const processedSessions = new Set();
        
        let totalMinutes = 0;
        
        // 如果有历史记录，计算历史记录的总时长
        if (todayRecords) {
            // 处理记录为数组的情况
            if (Array.isArray(todayRecords)) {
                todayRecords.forEach(record => {
                    // 记录此会话已被处理
                    processedSessions.add(record.startTime);
                    
                    // 检查记录中的午休时间设置是否与当前设置一致
                    // 如果不一致且记录中包含原始时间差，重新计算工作时长
                    if (record.hasOwnProperty('excludedBreakTime') && 
                        record.excludedBreakTime !== CONFIG.EXCLUDE_BREAK_TIME &&
                        record.hasOwnProperty('rawHours') && 
                        record.hasOwnProperty('rawMinutes') &&
                        record.hasOwnProperty('breakMinutes')) {
                        
                        // 获取原始时间差（分钟）
                        const rawTotalMinutes = record.rawHours * 60 + record.rawMinutes;
                        let adjustedWorkMinutes = rawTotalMinutes;
                        
                        // 根据当前设置重新计算工作时长
                        if (CONFIG.EXCLUDE_BREAK_TIME) {
                            // 只有当原始时间差超过午休时间，才减去午休时间
                            if (rawTotalMinutes > record.breakMinutes) {
                                adjustedWorkMinutes = rawTotalMinutes - record.breakMinutes;
                            }
                        }
                        
                        // 使用调整后的工作时长
                        totalMinutes += adjustedWorkMinutes;
                    } else {
                        // 使用已经保存在记录中的工作时长
                        totalMinutes += record.workHours * 60 + record.workMinutes;
                    }
                });
            } else {
                // 处理单个记录的情况
                processedSessions.add(todayRecords.startTime);
                
                // 检查记录中的午休时间设置是否与当前设置一致
                if (todayRecords.hasOwnProperty('excludedBreakTime') && 
                    todayRecords.excludedBreakTime !== CONFIG.EXCLUDE_BREAK_TIME &&
                    todayRecords.hasOwnProperty('rawHours') && 
                    todayRecords.hasOwnProperty('rawMinutes') &&
                    todayRecords.hasOwnProperty('breakMinutes')) {
                    
                    // 获取原始时间差（分钟）
                    const rawTotalMinutes = todayRecords.rawHours * 60 + todayRecords.rawMinutes;
                    let adjustedWorkMinutes = rawTotalMinutes;
                    
                    // 根据当前设置重新计算工作时长
                    if (CONFIG.EXCLUDE_BREAK_TIME) {
                        // 只有当原始时间差超过午休时间，才减去午休时间
                        if (rawTotalMinutes > todayRecords.breakMinutes) {
                            adjustedWorkMinutes = rawTotalMinutes - todayRecords.breakMinutes;
                        }
                    }
                    
                    // 使用调整后的工作时长
                    totalMinutes += adjustedWorkMinutes;
                } else {
                    // 使用已经保存在记录中的工作时长
                    totalMinutes += todayRecords.workHours * 60 + todayRecords.workMinutes;
                }
            }
        }
        
        // 特殊处理: 如果当前有活动的工作会话，且不在已保存的记录中，则添加当前会话的时间
        if (this.workStatus === CONFIG.STATUS.WORKING && this.workStartTime) {
            // 确保这个会话是今天的
            const sessionDateStr = Utils.formatDate(this.workStartTime);
            const currentSessionStartTime = this.workStartTime.getTime();
            
            if (sessionDateStr === dateStr && !processedSessions.has(currentSessionStartTime)) {
                // 检查当前会话是否已经包含在保存的记录中（使用更精确的比较）
                let sessionAlreadyCounted = false;
                
                // 遍历所有已处理的会话时间，检查是否与当前会话足够接近
                processedSessions.forEach(startTime => {
                    const timeDiff = Math.abs(startTime - currentSessionStartTime);
                    if (timeDiff < 1000) { // 1秒内的差异视为同一会话
                        sessionAlreadyCounted = true;
                    }
                });
                
                // 如果当前会话尚未被计算，加上当前会话的时间
                if (!sessionAlreadyCounted) {
                    // 直接使用计算当前会话的方法，它会考虑午休时间
                    const currentSession = this.calculateCurrentSessionDuration();
                    totalMinutes += currentSession.hours * 60 + currentSession.minutes;
                    
                    // 记录此会话已被处理
                    processedSessions.add(currentSessionStartTime);
                }
            }
        }
        
        // 转换为小时和分钟
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return { hours, minutes };
    },
    
    /**
     * 计算今日加班时长
     * @returns {Object} 加班时长对象，包含小时和分钟
     */
    calculateTodayOvertime() {
        // 获取当前工作时长（已经根据CONFIG.EXCLUDE_BREAK_TIME设置进行了调整）
        const duration = this.calculateTodayWorkDuration();
        const expectedDuration = this.calculateExpectedWorkDuration();
        
        // 计算总分钟数
        const totalWorkMinutes = duration.hours * 60 + duration.minutes;
        const expectedWorkMinutes = expectedDuration.hours * 60 + expectedDuration.minutes;
        
        // 计算加班时间（分钟）
        let overtimeMinutes = 0;
        
        if (totalWorkMinutes > expectedWorkMinutes) {
            overtimeMinutes = totalWorkMinutes - expectedWorkMinutes;
        }
        
        // 转换为小时和分钟
        const overtimeHours = Math.floor(overtimeMinutes / 60);
        const overtimeMinutesRemainder = overtimeMinutes % 60;
        
        return { hours: overtimeHours, minutes: overtimeMinutesRemainder };
    },
    
    /**
     * 重置当天的工作状态
     * 通常在新的一天启动时调用
     */
    resetDailyStatus() {
        this.stopTimer();
        this.stopCountdown();
        
        this.workStartTime = null;
        this.workEndTime = null;
        this.workStatus = CONFIG.STATUS.IDLE;
        
        // 清除本地存储中的当天数据
        Store.clearTodayData();
    },
    
    /**
     * 更新上班时间
     * @param {Date} newStartTime - 新的上班时间
     */
    updateWorkStartTime(newStartTime) {
        // 在手动编辑时，将用户输入的时间保存为realClockInTime（真实打卡时间，用于UI显示）
        this.realClockInTime = new Date(newStartTime);
        
        // 真实打卡时间肯定要保存到Storage
        Store.saveRealClockInTime(this.realClockInTime);
        
        // 更新内存中的上班时间（用于工时计算）
        // 如果编辑后的时间早于标准上班时间，使用标准上班时间作为计算依据
        const standardStartTime = new Date(newStartTime);
        standardStartTime.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
        
        if (newStartTime < standardStartTime) {
            // 对于计算，使用标准时间
            this.workStartTime = standardStartTime;
            console.log('编辑的时间早于标准上班时间，UI显示实际时间，计算使用标准时间');
        } else {
            // 如果晚于标准时间，则实际和用于计算的时间一致
            this.workStartTime = new Date(newStartTime);
        }
        
        // 保存到本地存储
        Store.saveWorkStartTime(this.workStartTime);
        
        // 更新显示
        this.updateElapsedTime();
        
        // 如果当前状态是工作中，重新启动计时器
        if (this.workStatus === CONFIG.STATUS.WORKING) {
            // 重启计时器以使用新的上班时间
            this.stopTimer();
            this.startTimer();
        }
    },
    
    /**
     * 更新下班时间
     * @param {Date} newEndTime - 新的下班时间
     */
    updateWorkEndTime(newEndTime) {
        // 更新内存中的下班时间
        this.workEndTime = newEndTime;
        
        // 保存到本地存储
        Store.saveWorkEndTime(this.workEndTime);
        
        // 更新显示
        this.updateElapsedTime();
    },
    
    /**
     * 重新计算工作记录
     * 当上下班时间被手动编辑后调用
     */
    recalculateWorkRecord() {
        console.log('重新计算工作记录');
        
        if (!this.workStartTime) return;
        
        // 获取日期
        const date = new Date(this.workStartTime);
        const dateStr = Utils.formatDate(date);
        
        // 清除临时状态
        this.lastTimeEditInfo = null;
        
        // 如果已下班，需要重新计算工作记录并保存
        if (this.workStatus === CONFIG.STATUS.COMPLETED && this.workEndTime) {
            // 先删除当前记录，然后保存新记录
            this.saveWorkRecord();
            console.log('已重新计算和保存工作记录');
        } else if (this.workStatus === CONFIG.STATUS.WORKING) {
            // 如果是工作中状态，重置计时器
            this.stopTimer();
            this.startTimer();
            console.log('已重置计时器');
        }
        
        // 确保保存真实打卡时间
        if (this.realClockInTime) {
            Store.saveRealClockInTime(this.realClockInTime);
        }
        
        // 更新配置
        this.updateConfigSettings();
    },
    
    /**
     * 计算当前会话的工作时长
     * 与calculateTodayWorkDuration不同，此方法只计算当前会话的时长，不包括历史记录
     * @returns {Object} 工作时长对象，包含小时和分钟
     */
    calculateCurrentSessionDuration() {
        if (!this.workStartTime) return { hours: 0, minutes: 0 };
        
        const endTime = this.workStatus === CONFIG.STATUS.COMPLETED ? 
            this.workEndTime : new Date();
            
        // 获取当前会话的原始时间差
        const rawDiff = Utils.calculateTimeDifference(this.workStartTime, endTime);
        const rawTotalMinutes = rawDiff.hours * 60 + rawDiff.minutes;
        
        // 计算标准工作时长和午休时间
        const expectedDuration = this.calculateExpectedWorkDuration();
        const expectedWorkMinutes = expectedDuration.hours * 60 + expectedDuration.minutes;
        
        // 从上下班设置计算实际上班下班之间的总时间（包含午休）
        const startDate = new Date();
        startDate.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
        
        const endDate = new Date();
        endDate.setHours(CONFIG.WORK_HOURS.END_HOUR, CONFIG.WORK_HOURS.END_MINUTE, 0, 0);
        
        // 如果跨天，调整结束时间
        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        // 计算标准上下班之间的总分钟数
        const standardTotalDiff = Utils.calculateTimeDifference(startDate, endDate);
        const standardTotalMinutes = standardTotalDiff.hours * 60 + standardTotalDiff.minutes;
        
        // 计算标准午休时间（分钟）
        const standardBreakMinutes = standardTotalMinutes - expectedWorkMinutes;
        
        // 计算实际工作时间，根据用户设置决定是否从原始时间差中减去午休时间
        let actualWorkMinutes = rawTotalMinutes;
        
        // 根据用户设置决定是否扣除午休时间
        if (CONFIG.EXCLUDE_BREAK_TIME) {
            // 只有当原始时间差超过标准午休时间，才减去午休时间
            if (rawTotalMinutes > standardBreakMinutes) {
                actualWorkMinutes = rawTotalMinutes - standardBreakMinutes;
            }
        }
        
        // 转换为小时和分钟
        const hours = Math.floor(actualWorkMinutes / 60);
        const minutes = actualWorkMinutes % 60;
        
        return { hours, minutes };
    },
    
    /**
     * 计算标准工作时长
     * 根据设置的标准上下班时间计算正常工作时长，考虑午休等非工作时间
     * @returns {Object} 工作时长对象，包含小时和分钟
     */
    calculateExpectedWorkDuration() {
        // 基本工作时长(8小时)
        const standardHours = CONFIG.STANDARD_WORK_HOURS;
        
        // 如果不扣除午休时间，应该增加午休时间作为预期工作时长
        if (!CONFIG.EXCLUDE_BREAK_TIME) {
            // 计算标准午休时间
            // 从上下班设置计算实际上班下班之间的总时间（包含午休）
            const startDate = new Date();
            startDate.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
            
            const endDate = new Date();
            endDate.setHours(CONFIG.WORK_HOURS.END_HOUR, CONFIG.WORK_HOURS.END_MINUTE, 0, 0);
            
            // 如果跨天，调整结束时间
            if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }
            
            // 计算标准上下班之间的总分钟数
            const standardTotalDiff = Utils.calculateTimeDifference(startDate, endDate);
            const standardTotalMinutes = standardTotalDiff.hours * 60 + standardTotalDiff.minutes;
            
            // 计算工作时长包含午休（总分钟数 = 标准工作分钟数 + 午休分钟数）
            const standardWorkMinutes = standardHours * 60;
            const standardBreakMinutes = standardTotalMinutes - standardWorkMinutes;
            
            console.log('扣除午休开关关闭，预期工作时长增加午休时间', {
                standardHours,
                standardWorkMinutes,
                standardBreakMinutes,
                newExpectedMinutes: standardWorkMinutes + standardBreakMinutes
            });
            
            // 增加午休时间到预期工作时长
            const totalExpectedMinutes = standardWorkMinutes + standardBreakMinutes;
            return {
                hours: Math.floor(totalExpectedMinutes / 60),
                minutes: totalExpectedMinutes % 60
            };
        }
        
        // 如果扣除午休时间，直接返回标准工作时长
        return {
            hours: standardHours,
            minutes: 0
        };
    },

    /**
     * 获取当前工作状态
     * @returns {Number} 工作状态（CONFIG.STATUS中的值）
     */
    getWorkStatus() {
        return this.workStatus;
    },

    /**
     * 更新配置设置
     */
    updateConfigSettings() {
        // 从本地存储加载配置
        const savedConfig = Store.loadConfig();
        
        if (savedConfig) {
            // 记录原始配置值，用于检测变化
            const oldStandardHours = CONFIG.WORK_HOURS.STANDARD_HOURS;
            const oldStartHour = CONFIG.WORK_HOURS.START_HOUR;
            const oldStartMinute = CONFIG.WORK_HOURS.START_MINUTE;
            const oldEndHour = CONFIG.WORK_HOURS.END_HOUR;
            const oldEndMinute = CONFIG.WORK_HOURS.END_MINUTE;
            const oldExcludeBreakTime = CONFIG.EXCLUDE_BREAK_TIME;
            
            // 配置是否有变化的标志
            let configChanged = false;
            
            // 更新工作时间设置
            if (typeof savedConfig.standardWorkHours === 'number') {
                if (CONFIG.WORK_HOURS.STANDARD_HOURS !== savedConfig.standardWorkHours) {
                    CONFIG.WORK_HOURS.STANDARD_HOURS = savedConfig.standardWorkHours;
                    configChanged = true;
                }
            }
            
            if (typeof savedConfig.startHour === 'number' && typeof savedConfig.startMinute === 'number') {
                if (CONFIG.WORK_HOURS.START_HOUR !== savedConfig.startHour || 
                    CONFIG.WORK_HOURS.START_MINUTE !== savedConfig.startMinute) {
                    CONFIG.WORK_HOURS.START_HOUR = savedConfig.startHour;
                    CONFIG.WORK_HOURS.START_MINUTE = savedConfig.startMinute;
                    configChanged = true;
                }
            }
            
            if (typeof savedConfig.endHour === 'number' && typeof savedConfig.endMinute === 'number') {
                if (CONFIG.WORK_HOURS.END_HOUR !== savedConfig.endHour || 
                    CONFIG.WORK_HOURS.END_MINUTE !== savedConfig.endMinute) {
                    CONFIG.WORK_HOURS.END_HOUR = savedConfig.endHour;
                    CONFIG.WORK_HOURS.END_MINUTE = savedConfig.endMinute;
                    configChanged = true;
                }
            }
            
            // 更新午休设置
            if (typeof savedConfig.excludeBreakTime === 'boolean') {
                if (CONFIG.EXCLUDE_BREAK_TIME !== savedConfig.excludeBreakTime) {
                    CONFIG.EXCLUDE_BREAK_TIME = savedConfig.excludeBreakTime;
                    configChanged = true;
                }
            }
            
            // 只在配置有变化时执行更新
            if (configChanged) {
                console.log('配置已更新', {
                    old: {
                        standardHours: oldStandardHours,
                        startHour: oldStartHour,
                        startMinute: oldStartMinute,
                        endHour: oldEndHour,
                        endMinute: oldEndMinute,
                        excludeBreakTime: oldExcludeBreakTime
                    },
                    new: savedConfig
                });
                
                // 更新UI和计时器
                this.updateTimerUI();
                
                // 重新计算所有存在的工作记录
                if (StatsController && typeof StatsController.recalculateAllStats === 'function') {
                    StatsController.recalculateAllStats();
                }
            }
        }
    },
    
    /**
     * 更新计时器UI
     * 在配置更新后调用，确保各种UI元素正确反映最新设置
     */
    updateTimerUI() {
        // 如果当前处于工作中状态，需要更新计时器和倒计时
        if (this.workStatus === CONFIG.STATUS.WORKING && this.workStartTime) {
            // 如果存在实际打卡时间
            if (this.realClockInTime) {
                const standardStartTime = new Date();
                standardStartTime.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
                
                // 重新计算工作开始时间（如果实际打卡时间早于标准上班时间，则使用标准上班时间）
                if (this.realClockInTime.getTime() < standardStartTime.getTime()) {
                    console.log('实际打卡时间早于标准时间，调整工作开始时间');
                    this.workStartTime = new Date(standardStartTime);
                    // 保存到本地存储
                    Store.saveWorkStartTime(this.workStartTime);
                }
            }
            
            // 停止计时器和倒计时，然后重新启动
            this.stopTimer();
            this.stopCountdown();
            this.startTimer();
            this.startCountdown();
            
            console.log('已重新启动计时器，使用新的工作时间设置');
        } else if (this.workStatus === CONFIG.STATUS.COMPLETED && this.workStartTime && this.workEndTime) {
            // 已下班状态，只需重新计算工作记录
            console.log('正在重新计算已完成的工作记录');
            this.recalculateWorkRecord();
        }
        
        // 更新已经过的时间显示
        this.updateElapsedTime();
        
        // 确保整个UI都被更新，包括状态图标、按钮和计时器圆圈
        if (UIController && typeof UIController.updateUIBasedOnWorkStatus === 'function') {
            UIController.updateUIBasedOnWorkStatus();
        }
    },

    /**
     * 更新工时记录
     * 在工作状态变化、配置更新等情况下调用，确保工时记录准确反映当前状态
     */
    updateWorkRecord() {
        // 只更新已有记录
        if (this.workStartTime && this.workEndTime) {
            const recordId = `${this.workStartTime.getTime()}`;
            
            // 计算工作时间（毫秒）
            let elapsedMs = this.workEndTime - this.workStartTime;
            
            // 计算工作时间（分钟）
            let actualWorkMinutes = Math.round(elapsedMs / 60000);
            
            // 根据用户设置确定是否扣除午休时间（仅影响统计数据，不影响打卡页面的计时器显示）
            if (CONFIG.EXCLUDE_BREAK_TIME) {
                // 获取标准午休时间（分钟）
                const standardBreakMinutes = (CONFIG.WORK_HOURS.BREAK_END_HOUR - CONFIG.WORK_HOURS.BREAK_START_HOUR) * 60 +
                                           (CONFIG.WORK_HOURS.BREAK_END_MINUTE - CONFIG.WORK_HOURS.BREAK_START_MINUTE);
                
                // 只有当工作时间超过午休时间，才扣除午休时间
                if (actualWorkMinutes > standardBreakMinutes) {
                    actualWorkMinutes -= standardBreakMinutes;
                }
            }
            
            // 转换为小时和分钟
            const hours = Math.floor(actualWorkMinutes / 60);
            const minutes = actualWorkMinutes % 60;
            
            // 更新或添加工作记录
            Store.updateWorkRecord(
                recordId,
                Utils.formatDate(this.workStartTime),
                this.workStartTime,
                this.workEndTime,
                hours,
                minutes
            );
            
            // 如果有实际打卡时间，保存用于查询
            if (this.realClockInTime) {
                Store.saveRealClockInTime(recordId, this.realClockInTime);
            }
            
            console.log('工作记录已更新', {
                startTime: this.workStartTime,
                endTime: this.workEndTime,
                realClockInTime: this.realClockInTime,
                hours,
                minutes
            });
        }
    },
}; 