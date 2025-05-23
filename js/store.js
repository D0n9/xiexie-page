/**
 * 数据存储模块
 * 负责管理所有数据的保存和获取
 */

const Store = {
    /**
     * 保存数据到本地存储
     * @param {string} key - 存储键名
     * @param {*} value - 要存储的值
     */
    save(key, value) {
        try {
            // 对于特殊的workStatus键，添加额外的日志
            if (key === CONFIG.STORAGE_KEYS.WORK_STATUS) {
                console.log(`通过save方法保存工作状态, 键: ${key}, 值: ${value}`);
            }
            
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            
            // 验证关键数据是否正确保存
            if (key === CONFIG.STORAGE_KEYS.WORK_STATUS || 
                key === CONFIG.STORAGE_KEYS.WORK_START_TIME || 
                key === CONFIG.STORAGE_KEYS.WORK_END_TIME) {
                
                const savedRaw = localStorage.getItem(key);
                console.log(`保存后验证 ${key}:`, savedRaw);
                
                try {
                    const savedValue = JSON.parse(savedRaw);
                    if (savedValue !== value) {
                        console.warn(`${key} 保存不一致, 预期: ${value}, 实际: ${savedValue}`);
                    }
                } catch (parseError) {
                    console.error(`无法解析保存的 ${key} 值:`, parseError);
                }
            }
        } catch (error) {
            console.error('保存到localStorage出错:', error, '键:', key, '值:', value);
        }
    },
    
    /**
     * 从本地存储获取数据
     * @param {string} key - 存储键名
     * @param {*} defaultValue - 如果未找到数据，返回的默认值
     * @returns {*} 存储的值或默认值
     */
    get(key, defaultValue = null) {
        try {
            const serializedValue = localStorage.getItem(key);
            if (serializedValue === null) {
                return defaultValue;
            }
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('Error getting from localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * 保存工作开始时间
     * @param {Date} time - 工作开始时间
     */
    saveWorkStartTime(time) {
        this.save(CONFIG.STORAGE_KEYS.WORK_START_TIME, time.getTime());
    },
    
    /**
     * 获取工作开始时间
     * @returns {Date|null} 工作开始时间或null
     */
    getWorkStartTime() {
        const timestamp = this.get(CONFIG.STORAGE_KEYS.WORK_START_TIME);
        return timestamp ? new Date(timestamp) : null;
    },
    
    /**
     * 保存真实打卡时间
     * @param {Date} realClockInTime - 真实的打卡时间
     */
    saveRealClockInTime(realClockInTime) {
        if (realClockInTime) {
            this.save('realClockInTime', realClockInTime.toISOString());
            console.log('已保存真实打卡时间:', Utils.formatTime(realClockInTime));
        }
    },
    
    /**
     * 获取实际打卡时间
     * @returns {Date|null} 实际打卡时间或null
     */
    getRealClockInTime() {
        const timestamp = this.get('realClockInTime');
        return timestamp ? new Date(timestamp) : null;
    },
    
    /**
     * 保存工作结束时间
     * @param {Date} time - 工作结束时间
     */
    saveWorkEndTime(time) {
        this.save(CONFIG.STORAGE_KEYS.WORK_END_TIME, time.getTime());
    },
    
    /**
     * 获取工作结束时间
     * @returns {Date|null} 工作结束时间或null
     */
    getWorkEndTime() {
        const timestamp = this.get(CONFIG.STORAGE_KEYS.WORK_END_TIME);
        return timestamp ? new Date(timestamp) : null;
    },
    
    /**
     * 保存工作状态
     * @param {string} status - 工作状态
     */
    saveWorkStatus(status) {
        this.save(CONFIG.STORAGE_KEYS.WORK_STATUS, status);
    },
    
    /**
     * 获取工作状态（包括状态和时间）
     * @returns {Object} 工作状态对象
     */
    getWorkStatus() {
        const status = this.get(CONFIG.STORAGE_KEYS.WORK_STATUS, CONFIG.STATUS.IDLE);
        const startTimeStr = this.get(CONFIG.STORAGE_KEYS.WORK_START_TIME, null);
        const endTimeStr = this.get(CONFIG.STORAGE_KEYS.WORK_END_TIME, null);
        const realClockInTimeStr = this.get('realClockInTime', null);
        
        return {
            workStatus: status,
            workStartTime: startTimeStr,
            workEndTime: endTimeStr,
            realClockInTime: realClockInTimeStr
        };
    },
    
    /**
     * 保存每日工作记录
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @param {Object} record - 工作记录
     */
    saveDailyRecord(date, record) {
        const records = this.get(CONFIG.STORAGE_KEYS.DAILY_RECORDS, {});
        
        // 如果该日期已有记录，将新记录添加到数组
        if (records[date]) {
            // 检查记录是否已经是数组
            if (Array.isArray(records[date])) {
                records[date].push(record);
            } else {
                // 如果不是数组，将原有记录和新记录放入数组
                records[date] = [records[date], record];
            }
        } else {
            // 新的日期记录，初始化为数组
            records[date] = [record];
        }
        
        this.save(CONFIG.STORAGE_KEYS.DAILY_RECORDS, records);
    },
    
    /**
     * 获取特定日期的工作记录
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @returns {Object|null} 工作记录或null
     */
    getDailyRecord(date) {
        const records = this.get(CONFIG.STORAGE_KEYS.DAILY_RECORDS, {});
        return records[date] || null;
    },
    
    /**
     * 获取所有工作记录
     * @returns {Object} 工作记录对象，以日期为键
     */
    getAllRecords() {
        // 直接从DAILY_RECORDS获取所有记录
        return this.get(CONFIG.STORAGE_KEYS.DAILY_RECORDS, {});
    },
    
    /**
     * 清除今日的工作数据
     */
    clearTodayData() {
        this.save(CONFIG.STORAGE_KEYS.WORK_START_TIME, null);
        this.save(CONFIG.STORAGE_KEYS.WORK_END_TIME, null);
        this.save(CONFIG.STORAGE_KEYS.WORK_STATUS, CONFIG.STATUS.IDLE);
        this.save('realClockInTime', null);
    },
    
    /**
     * 获取指定日期范围内的工作记录
     * @param {Date} startDate - 开始日期
     * @param {Date} endDate - 结束日期
     * @returns {Array} 指定日期范围内的工作记录数组
     */
    getRecordsInRange(startDate, endDate) {
        console.log('获取日期范围记录:', { 
            startDate, 
            endDate,
            startDateStr: Utils.formatDate(startDate),
            endDateStr: Utils.formatDate(endDate) 
        });
        
        // 确保日期对象有效
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
            console.error('日期参数无效:', { startDate, endDate });
            return [];
        }
        
        // 格式化日期范围为字符串，便于查询
        const startDateStr = Utils.formatDate(startDate);
        const endDateStr = Utils.formatDate(endDate);
        
        // 获取所有记录
        const allRecords = this.getAllRecords();
        const result = [];
        
        // 遍历所有日期的记录，找出在范围内的
        for (const dateStr in allRecords) {
            // 确保日期格式正确
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                console.warn('跳过无效日期格式:', dateStr);
                continue;
            }
            
            // 比较日期字符串，检查是否在范围内
            if (dateStr >= startDateStr && dateStr <= endDateStr) {
                const dateRecord = allRecords[dateStr];
                
                // 添加到结果集
                if (Array.isArray(dateRecord)) {
                    // 如果是数组，添加每条记录
                    dateRecord.forEach(record => {
                        result.push({
                            date: dateStr,
                            ...record
                        });
                    });
                } else if (dateRecord) {
                    // 如果是单条记录，直接添加
                    result.push({
                        date: dateStr,
                        ...dateRecord
                    });
                }
            }
        }
        
        // 添加: 检查当前是否为COMPLETED状态且有今日记录但尚未保存
        const today = new Date();
        const todayStr = Utils.formatDate(today);
        const workStatus = this.getWorkStatus();
        
        // 如果已经下班，且开始和结束时间存在，但这条记录尚未保存到allRecords中
        const workStartTime = this.getWorkStartTime();
        const workEndTime = this.getWorkEndTime();
        
        if (workStatus === CONFIG.STATUS.COMPLETED && 
            workStartTime && workEndTime &&
            !allRecords[todayStr]) {
            
            // 计算工作时长
            const rawDiff = Utils.calculateTimeDifference(workStartTime, workEndTime);
            const rawTotalMinutes = rawDiff.hours * 60 + rawDiff.minutes;
            
            // 计算标准工作时长
            const startDate = new Date();
            startDate.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
            
            const endDate = new Date();
            endDate.setHours(CONFIG.WORK_HOURS.END_HOUR, CONFIG.WORK_HOURS.END_MINUTE, 0, 0);
            
            // 如果跨天，调整结束时间
            if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }
            
            // 计算标准上下班之间的总分钟数
            const expectedDuration = TimerService.calculateExpectedWorkDuration();
            const expectedWorkMinutes = expectedDuration.hours * 60 + expectedDuration.minutes;
            
            const standardTotalDiff = Utils.calculateTimeDifference(startDate, endDate);
            const standardTotalMinutes = standardTotalDiff.hours * 60 + standardTotalDiff.minutes;
            
            // 计算标准午休时间（分钟）
            const standardBreakMinutes = standardTotalMinutes - expectedWorkMinutes;
            
            // 计算实际工作时间
            let actualWorkMinutes = rawTotalMinutes;
            
            // 根据用户设置决定是否扣除午休时间
            if (CONFIG.EXCLUDE_BREAK_TIME && rawTotalMinutes > standardBreakMinutes) {
                actualWorkMinutes = rawTotalMinutes - standardBreakMinutes;
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
            
            // 将当前会话添加到结果中
            const todayDate = new Date(todayStr);
            if (todayStr >= startDateStr && todayStr <= endDateStr) {
                // 获取真实打卡时间
                const realClockInTime = this.getRealClockInTime();
                
                result.push({
                    date: todayStr,
                    workHours,
                    workMinutes,
                    overtimeHours,
                    overtimeMinutes,
                    startTime: workStartTime.getTime(),
                    // 添加真实打卡时间，优先使用realClockInTime，如果没有则使用workStartTime
                    realStartTime: realClockInTime ? realClockInTime.getTime() : workStartTime.getTime(),
                    endTime: workEndTime.getTime(),
                    status: CONFIG.STATUS.COMPLETED
                });
            }
        }
        
        return result.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    
    /**
     * 获取本周的工作记录
     * @returns {Array} 本周的工作记录数组
     */
    getWeekRecords() {
        const weekStart = Utils.getWeekStartDate();
        const today = new Date();
        return this.getRecordsInRange(weekStart, today);
    },
    
    /**
     * 获取指定周的工作记录
     * @param {Date} weekStartDate - 周开始日期
     * @param {Date} weekEndDate - 周结束日期
     * @returns {Array} 指定周的工作记录数组
     */
    getWeekRecordsByRange(weekStartDate, weekEndDate) {
        return this.getRecordsInRange(weekStartDate, weekEndDate);
    },
    
    /**
     * 获取本月的工作记录
     * @returns {Array} 本月的工作记录数组
     */
    getMonthRecords() {
        const monthStart = Utils.getMonthStartDate();
        const today = new Date();
        return this.getRecordsInRange(monthStart, today);
    },
    
    /**
     * 获取特定月份的工作记录
     * @param {Date} date - 月份中的任一日期
     * @returns {Array} 指定月份的工作记录数组
     */
    getMonthRecordsByDate(date) {
        console.log('获取月份记录:', date);
        
        // 创建所选月份的第一天
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        
        // 创建所选月份的最后一天 - 通过获取下个月的第0天（即当前月的最后一天）
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        console.log('月份范围:', { 
            startDate: monthStart, 
            endDate: monthEnd,
            startDateStr: Utils.formatDate(monthStart),
            endDateStr: Utils.formatDate(monthEnd)
        });
        
        // 如果是当前月，调用getMonthRecords
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            return this.getMonthRecords();
        }
        
        // 返回指定日期范围内的记录
        return this.getRecordsInRange(monthStart, monthEnd);
    },
    
    /**
     * 获取本年的工作记录
     * @returns {Array} 本年的工作记录数组
     */
    getYearRecords() {
        const yearStart = Utils.getYearStartDate();
        const today = new Date();
        return this.getRecordsInRange(yearStart, today);
    },
    
    /**
     * 获取指定年份的工作记录
     * @param {number} year - 年份
     * @returns {Array} 指定年份的工作记录数组
     */
    getYearRecordsByYear(year) {
        // 创建指定年份的开始和结束日期
        const yearStart = new Date(year, 0, 1); // 1月1日
        const yearEnd = new Date(year, 11, 31); // 12月31日
        
        // 如果年份是当前年份，结束日期为今天
        const today = new Date();
        if (year === today.getFullYear() && yearEnd > today) {
            return this.getRecordsInRange(yearStart, today);
        }
        
        return this.getRecordsInRange(yearStart, yearEnd);
    },
    
    /**
     * 保存配置到本地存储
     * @param {Object} config - 配置对象 
     * @returns {boolean} 保存成功返回true，否则返回false
     */
    saveConfig(config) {
        try {
            // 获取当前配置或创建新配置
            const currentConfig = this.loadConfig() || {};
            
            // 更新配置
            const updatedConfig = {
                ...currentConfig,
                ...config
            };
            
            // 保存到本地存储
            localStorage.setItem(CONFIG.STORAGE_KEYS.APP_CONFIG, JSON.stringify(updatedConfig));
            
            // 应用配置更新到全局CONFIG
            if (typeof config.standardWorkHours === 'number') {
                CONFIG.WORK_HOURS.STANDARD_HOURS = config.standardWorkHours;
            }
            
            if (typeof config.startHour === 'number' && typeof config.startMinute === 'number') {
                CONFIG.WORK_HOURS.START_HOUR = config.startHour;
                CONFIG.WORK_HOURS.START_MINUTE = config.startMinute;
            }
            
            if (typeof config.endHour === 'number' && typeof config.endMinute === 'number') {
                CONFIG.WORK_HOURS.END_HOUR = config.endHour;
                CONFIG.WORK_HOURS.END_MINUTE = config.endMinute;
            }
            
            if (typeof config.excludeBreakTime === 'boolean') {
                CONFIG.EXCLUDE_BREAK_TIME = config.excludeBreakTime;
            }
            
            return true;
        } catch (error) {
            console.error('保存配置到本地存储失败:', error);
            return false;
        }
    },
    
    /**
     * 从本地存储加载配置
     * @returns {Object|null} 配置对象或null（如果不存在）
     */
    loadConfig() {
        try {
            const configStr = localStorage.getItem(CONFIG.STORAGE_KEYS.APP_CONFIG);
            if (!configStr) return null;
            
            // 解析配置
            const savedConfig = JSON.parse(configStr);
            
            // 将配置应用到全局CONFIG
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
            
            if (typeof savedConfig.excludeBreakTime === 'boolean') {
                CONFIG.EXCLUDE_BREAK_TIME = savedConfig.excludeBreakTime;
            }
            
            return savedConfig;
        } catch (error) {
            console.error('从本地存储加载配置失败:', error);
            return null;
        }
    },
    
    /**
     * 清除所有打卡记录
     */
    clearAllRecords() {
        const keysToRemove = [];
        
        // 收集所有日期格式的键
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                keysToRemove.push(key);
            }
        }
        
        // 删除收集到的键
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        return keysToRemove.length; // 返回删除的记录数
    },
    
    /**
     * 从本地存储中删除项
     * @param {string} key - 要删除的存储键
     * @returns {boolean} 删除成功返回true，否则返回false
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('从本地存储删除数据失败:', error);
            return false;
        }
    },
    
    /**
     * 获取今天的工作记录
     * @returns {Object|null} 今天的工作记录或null（如果不存在）
     */
    getTodayWorkRecord() {
        const today = Utils.formatDate(new Date());
        return this.getWorkRecord(today);
    },
    
    /**
     * 获取指定日期的工作记录
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @returns {Object|null} 工作记录或null（如果不存在）
     */
    getWorkRecord(date) {
        const records = this.get(CONFIG.STORAGE_KEYS.WORK_RECORD, {});
        return records[date] || null;
    },
    
    /**
     * 保存今天的工作记录
     * @param {Object} record - 工作记录对象
     * @returns {boolean} 保存成功返回true，否则返回false
     */
    saveTodayWorkRecord(record) {
        const today = Utils.formatDate(new Date());
        return this.saveWorkRecord(today, record);
    },
    
    /**
     * 保存指定日期的工作记录
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @param {Object} record - 工作记录对象
     * @returns {boolean} 保存成功返回true，否则返回false
     */
    saveWorkRecord(date, record) {
        try {
            // 获取所有工作记录
            const records = this.get(CONFIG.STORAGE_KEYS.WORK_RECORD, {});
            
            // 更新指定日期的记录
            records[date] = record;
            
            // 保存回本地存储
            return this.save(CONFIG.STORAGE_KEYS.WORK_RECORD, records);
        } catch (error) {
            console.error('保存工作记录失败:', error);
            return false;
        }
    },
    
    /**
     * 获取所有工作记录
     * @returns {Object} 所有工作记录
     */
    getAllWorkRecords() {
        return this.get(CONFIG.STORAGE_KEYS.WORK_RECORD, {});
    },
    
    /**
     * 清除所有工作记录
     * @returns {boolean} 清除成功返回true，否则返回false
     */
    clearAllWorkRecords() {
        return this.save(CONFIG.STORAGE_KEYS.WORK_RECORD, {});
    }
}; 