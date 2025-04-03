/**
 * 工具函数
 */

const Utils = {
    /**
     * 格式化日期为 YYYY-MM-DD 格式
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * 格式化时间为 HH:MM:SS 格式
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    },
    
    /**
     * 格式化时间为 HH:MM 格式（不含秒）
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的时间字符串
     */
    formatTimeShort(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },
    
    /**
     * 将毫秒数格式化为时分秒
     * @param {number} milliseconds - 毫秒数
     * @returns {string} 格式化后的时间字符串 (HH:MM:SS)
     */
    formatDuration(milliseconds) {
        if (!milliseconds) return '00:00:00';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
    
    /**
     * 计算两个日期之间的时间差（小时、分钟和秒）
     * @param {Date} startDate - 开始日期
     * @param {Date} endDate - 结束日期
     * @returns {Object} 包含小时、分钟和秒的对象
     */
    calculateTimeDifference(startDate, endDate) {
        const diffMs = endDate - startDate;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        return {
            hours: diffHours,
            minutes: diffMinutes,
            seconds: diffSeconds,
            totalMinutes: diffHours * 60 + diffMinutes,
            milliseconds: diffMs
        };
    },
    
    /**
     * 获取今天的日期对象（时间设置为 00:00:00）
     * @returns {Date} 今天的日期对象
     */
    getTodayDate() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    },
    
    /**
     * 获取本周的开始日期（周一）
     * @returns {Date} 本周一的日期对象
     */
    getWeekStartDate() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    },
    
    /**
     * 获取指定日期所在周的开始日期（周一）
     * @param {Date} date - 日期对象
     * @returns {Date} 该日期所在周的周一日期对象
     */
    getWeekStartDateByDate(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    },
    
    /**
     * 获取相对于指定日期的偏移周的开始日期
     * @param {Date} date - 参考日期对象
     * @param {number} offset - 周偏移量，负数表示往前，正数表示往后
     * @returns {Date} 偏移后的周一日期对象
     */
    getOffsetWeekStartDate(date, offset) {
        // 先获取给定日期所在周的周一
        const weekStart = this.getWeekStartDateByDate(date);
        // 然后根据偏移量计算新的日期
        const offsetDate = new Date(weekStart);
        offsetDate.setDate(weekStart.getDate() + (offset * 7));
        return offsetDate;
    },
    
    /**
     * 获取本月的开始日期
     * @returns {Date} 本月1号的日期对象
     */
    getMonthStartDate() {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
    },
    
    /**
     * 获取本年的开始日期
     * @returns {Date} 本年1月1号的日期对象
     */
    getYearStartDate() {
        const today = new Date();
        return new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
    },
    
    /**
     * 格式化工作时长
     * @param {number} hours - 小时数
     * @param {number} minutes - 分钟数
     * @returns {string} 格式化后的工作时长字符串
     */
    formatWorkDuration(hours, minutes) {
        if (hours === 0 && minutes === 0) return '0小时0分钟';
        return `${hours}小时${minutes}分钟`;
    },
    
    /**
     * 获取日期的星期名称
     * @param {Date} date - 日期对象
     * @returns {string} 星期名称
     */
    getDayOfWeek(date) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    },
    
    /**
     * 检查两个日期是否是同一天
     * @param {Date} date1 - 第一个日期
     * @param {Date} date2 - 第二个日期
     * @returns {boolean} 是否是同一天
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    },
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}; 