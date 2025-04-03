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
        
        console.log('计时器服务初始化完成，当前状态:', this.workStatus);
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
        
        // 加载实际打卡时间
        const realClockInTimeStr = Store.get('realClockInTime', null);
        this.realClockInTime = realClockInTimeStr ? new Date(realClockInTimeStr) : null;
        
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
        // 立即更新一次已经过的时间
        const now = new Date();
        const elapsed = now - this.workStartTime;
        document.getElementById('time-display').textContent = Utils.formatDuration(elapsed);
        
        // 设置定时器，每秒更新一次
        this.timerId = setInterval(() => {
            this.updateElapsedTime();
        }, CONFIG.TIMER_INTERVAL);
    },
    
    /**
     * 更新已经过的时间显示
     */
    updateElapsedTime() {
        // 获取当天总工作时长（包括当前会话和历史记录）
        const totalWorkDuration = this.calculateTodayWorkDuration();
        
        // 将总工作时长转换为毫秒格式以用于显示（小时和分钟）
        let totalWorkMs = (totalWorkDuration.hours * 3600 + totalWorkDuration.minutes * 60) * 1000;
        
        // 如果当前正在工作中，加上当前会话的秒数以保持秒位更新
        if (this.workStatus === CONFIG.STATUS.WORKING && this.workStartTime) {
            const now = new Date();
            const currentSessionMs = now - this.workStartTime;
            
            // 计算当前会话时间的秒数部分（不包括整分钟）
            const currentSessionSeconds = Math.floor((currentSessionMs / 1000) % 60);
            
            // 将秒数加入到总时长中
            totalWorkMs += currentSessionSeconds * 1000;
        } 
        // 已下班状态 - 时间应该固定不变，不再更新秒数
        
        // 更新圆圈中的时间显示为总工作时长
        document.getElementById('time-display').textContent = Utils.formatDuration(totalWorkMs);
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
        
        // 保存实际打卡时间用于UI显示
        this.realClockInTime = new Date();
        
        // 创建上班时间，使用标准上班时间
        const today = new Date();
        this.workStartTime = new Date(today);
        this.workStartTime.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
        
        // 如果实际打卡时间晚于标准上班时间，则使用实际打卡时间
        if (this.realClockInTime > this.workStartTime) {
            this.workStartTime = this.realClockInTime;
        }
        
        this.workStatus = CONFIG.STATUS.WORKING;
        
        // 保存到本地存储
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
        // 在手动编辑时，同时更新 realClockInTime 和 workStartTime
        this.realClockInTime = new Date(newStartTime);
        
        // 更新内存中的上班时间
        // 如果编辑后的时间早于标准上班时间，使用标准上班时间作为计算依据
        const standardStartTime = new Date(newStartTime);
        standardStartTime.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
        
        if (newStartTime < standardStartTime) {
            this.workStartTime = standardStartTime;
        } else {
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
     * 在手动修改上班/下班时间后调用
     */
    recalculateWorkRecord() {
        // 如果没有上班时间，无法计算
        if (!this.workStartTime) return;
        
        // 获取日期字符串（从上班时间获取）
        const dateStr = Utils.formatDate(this.workStartTime);
        
        // 如果当前状态为已下班，且有下班时间，重新计算并保存记录
        if (this.workStatus === CONFIG.STATUS.COMPLETED && this.workEndTime) {
            // 确保状态保存正确
            Store.saveWorkStatus(this.workStatus);
            
            // 获取上下班时间之间的原始时间差
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
            
            // 创建工作记录
            const record = {
                // 如果是手动编辑，可能需要更新 realClockInTime
                realStartTime: this.realClockInTime ? this.realClockInTime.getTime() : this.workStartTime.getTime(),
                startTime: this.workStartTime.getTime(),
                endTime: this.workEndTime.getTime(),
                workHours: workHours,
                workMinutes: workMinutes,
                overtimeHours,
                overtimeMinutes,
                rawHours: rawDiff.hours,
                rawMinutes: rawDiff.minutes,
                breakMinutes: standardBreakMinutes,
                excludedBreakTime: CONFIG.EXCLUDE_BREAK_TIME, // 记录当时的午休时间扣除设置
                status: this.workStatus,
                editedManually: true, // 标记为手动编辑
                sessionId: Date.now() // 添加唯一会话ID，避免重复
            };
            
            // 保存到本地存储
            const todayRecords = Store.getDailyRecord(dateStr);
            
            if (todayRecords) {
                if (Array.isArray(todayRecords)) {
                    // 删除与当前会话有相同起止时间的记录
                    const currentSessionStartTime = this.workStartTime.getTime();
                    const currentSessionEndTime = this.workEndTime.getTime();
                    
                    // 过滤出不包含当前会话时间段的记录
                    const filteredRecords = todayRecords.filter(rec => {
                        // 比较开始和结束时间的接近程度
                        // 如果两个记录的开始和结束时间都很接近，判定为同一会话的修改版本
                        // 或者如果编辑后的时间段包含在原记录时间内，也可能是同一会话的编辑版本
                        const sameStartTime = Math.abs(rec.startTime - currentSessionStartTime) < 5000; // 5秒容差
                        const sameEndTime = Math.abs(rec.endTime - currentSessionEndTime) < 5000; // 5秒容差
                        
                        // 如果是明显同一会话的记录，就过滤掉
                        return !(sameStartTime && sameEndTime);
                    });
                    
                    // 添加新记录
                    filteredRecords.push(record);
                    
                    // 按开始时间从新到旧排序
                    filteredRecords.sort((a, b) => b.startTime - a.startTime);
                    
                    // 保存更新后的记录
                    Store.save(CONFIG.STORAGE_KEYS.DAILY_RECORDS, {
                        ...Store.getAllRecords(),
                        [dateStr]: filteredRecords
                    });
                    
                    console.log('更新工作记录，已过滤重复会话，新记录总数:', filteredRecords.length);
                } else {
                    // 单条记录情况，检查是否同一会话
                    const sameStartTime = Math.abs(todayRecords.startTime - this.workStartTime.getTime()) < 5000;
                    const sameEndTime = Math.abs(todayRecords.endTime - this.workEndTime.getTime()) < 5000;
                    
                    if (sameStartTime && sameEndTime) {
                        // 同一会话，替换
                        Store.save(CONFIG.STORAGE_KEYS.DAILY_RECORDS, {
                            ...Store.getAllRecords(),
                            [dateStr]: record
                        });
                    } else {
                        // 不同会话，创建数组
                        Store.save(CONFIG.STORAGE_KEYS.DAILY_RECORDS, {
                            ...Store.getAllRecords(),
                            [dateStr]: [todayRecords, record]
                        });
                    }
                }
            } else {
                // 没有记录，直接保存
                Store.saveDailyRecord(dateStr, record);
            }
            
            // 更新UI显示
            this.updateElapsedTime();
        } else if (this.workStatus === CONFIG.STATUS.WORKING) {
            // 正在工作中状态下编辑时间，只需更新UI
            this.updateElapsedTime();
        }
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
        return {
            hours: CONFIG.STANDARD_WORK_HOURS,
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
            // 更新工作时间设置
            if (typeof savedConfig.standardWorkHours === 'number') {
                CONFIG.WORK_HOURS.STANDARD_HOURS = savedConfig.standardWorkHours;
            }
            
            if (typeof savedConfig.startHour === 'number' && typeof savedConfig.startMinute === 'number') {
                CONFIG.WORK_HOURS.START_HOUR = savedConfig.startHour;
                CONFIG.WORK_HOURS.START_MINUTE = savedConfig.startMinute;
            }
            
            if (typeof savedConfig.endHour === 'number' && typeof savedConfig.endMinute === 'number') {
                CONFIG.WORK_HOURS.END_HOUR = savedConfig.endHour;
                CONFIG.WORK_HOURS.END_MINUTE = savedConfig.endMinute;
            }
            
            // 更新午休设置
            if (typeof savedConfig.excludeBreakTime === 'boolean') {
                CONFIG.EXCLUDE_BREAK_TIME = savedConfig.excludeBreakTime;
            }
            
            console.log('配置已更新', savedConfig);
            
            // 更新UI
            this.updateTimerUI();
            
            // 重新计算所有存在的工作记录
            if (StatsController && typeof StatsController.recalculateAllStats === 'function') {
                StatsController.recalculateAllStats();
            }
        }
    },
    
    /**
     * 更新配置设置
     */
    updateTimerUI() {
        // 更新UI
        this.updateElapsedTime();
    },
}; 