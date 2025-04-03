/**
 * 应用配置文件
 */

const CONFIG = {
    // 应用信息
    APP_VERSION: '1.5.0',
    APP_UPDATE_DATE: '2023-09-15',
    
    // 工作时间相关配置
    WORK_HOURS: {
        STANDARD_HOURS: 8, // 标准工作时间（小时）
        START_HOUR: 9,     // 标准上班时间（小时）
        START_MINUTE: 0,   // 标准上班时间（分钟）
        END_HOUR: 18,      // 标准下班时间（小时）
        END_MINUTE: 0      // 标准下班时间（分钟）
    },
    
    // 本地存储键名
    STORAGE_KEYS: {
        WORK_START_TIME: 'workStartTime',
        WORK_END_TIME: 'workEndTime',
        WORK_STATUS: 'workStatus',
        DAILY_RECORDS: 'dailyRecords',
        WORK_RECORDS: 'workRecords',
        USER_WORK_HOURS: 'userWorkHours',
        FIRST_VISIT: 'firstVisit',
        WORK_RECORD: 'workRecord',
        TIME_EDITS: 'timeEdits',
        EXTRA_WORK_RECORDS: 'extra_work_records',
        APP_CONFIG: 'app_config'
    },
    
    // 工作状态枚举
    STATUS: {
        IDLE: 0,
        WORKING: 1,
        COMPLETED: 2
    },
    
    // 定时器刷新间隔（毫秒）
    TIMER_INTERVAL: 1000,
    
    // 界面文本
    UI_TEXT: {
        IDLE: '等待打卡',
        WORKING: '工作中',
        COMPLETED: '已下班',
        BREAK: '休息中'
    },
    
    // 图表颜色
    CHART_COLORS: {
        WORK: '#4F46E5',
        OVERTIME: '#EC4899',
        BACKGROUND: '#F3F4F6'
    },
    
    // 工作时间设置
    STANDARD_WORK_HOURS: 8,
    BREAK_DURATION: 1,
    BREAK_START_TIME: '12:00',
    BREAK_END_TIME: '13:00',
    
    // 是否在工时计算中扣除午休时间
    EXCLUDE_BREAK_TIME: true,
    
    // 超时提醒（分钟）
    WORKING_OVERTIME_THRESHOLD_1: 8 * 60, // 8小时
    WORKING_OVERTIME_THRESHOLD_2: 9 * 60, // 9小时
};

// 从本地存储加载用户配置
(function loadUserConfig() {
    // 检查 Store 是否已定义
    if (typeof Store === 'undefined' || !Store || !Store.loadConfig) {
        console.log('Store 未定义或 loadConfig 方法不可用，将稍后加载配置');
        // 添加一个标记，表示需要稍后加载配置
        window.needsConfigReload = true;
        return;
    }

    const savedConfig = Store.loadConfig();
    
    if (savedConfig) {
        // 更新标准工作时间
        if (typeof savedConfig.standardWorkHours === 'number' && 
            savedConfig.standardWorkHours >= 1 && 
            savedConfig.standardWorkHours <= 12) {
            CONFIG.STANDARD_WORK_HOURS = savedConfig.standardWorkHours;
            
            // 同步更新 WORK_HOURS 中的标准工作时间
            CONFIG.WORK_HOURS.STANDARD_HOURS = savedConfig.standardWorkHours;
        }
        
        // 更新上下班时间
        if (typeof savedConfig.startHour === 'number' && typeof savedConfig.startMinute === 'number') {
            CONFIG.WORK_HOURS.START_HOUR = savedConfig.startHour;
            CONFIG.WORK_HOURS.START_MINUTE = savedConfig.startMinute;
        }
        
        if (typeof savedConfig.endHour === 'number' && typeof savedConfig.endMinute === 'number') {
            CONFIG.WORK_HOURS.END_HOUR = savedConfig.endHour;
            CONFIG.WORK_HOURS.END_MINUTE = savedConfig.endMinute;
        }
        
        // 更新午休时长
        if (typeof savedConfig.breakDuration === 'number' && 
            savedConfig.breakDuration >= 0 && 
            savedConfig.breakDuration <= 3) {
            CONFIG.BREAK_DURATION = savedConfig.breakDuration;
        }
        
        // 更新午休时间
        if (savedConfig.breakStartTime && /^\d{1,2}:\d{2}$/.test(savedConfig.breakStartTime)) {
            CONFIG.BREAK_START_TIME = savedConfig.breakStartTime;
        }
        
        if (savedConfig.breakEndTime && /^\d{1,2}:\d{2}$/.test(savedConfig.breakEndTime)) {
            CONFIG.BREAK_END_TIME = savedConfig.breakEndTime;
        }
        
        // 更新是否扣除午休时间的设置
        if (typeof savedConfig.excludeBreakTime === 'boolean') {
            CONFIG.EXCLUDE_BREAK_TIME = savedConfig.excludeBreakTime;
        }
        
        // 更新加班阈值
        CONFIG.WORKING_OVERTIME_THRESHOLD_1 = CONFIG.STANDARD_WORK_HOURS * 60;
        CONFIG.WORKING_OVERTIME_THRESHOLD_2 = (CONFIG.STANDARD_WORK_HOURS + 1) * 60;
        
        console.log('已从配置文件加载用户设置', savedConfig);
    }
})();

// 如果APP_VERSION不存在，添加它到CONFIG对象中
if (!CONFIG.APP_VERSION) {
    CONFIG.APP_VERSION = '1.0.0';
} 