/**
 * 统计控制器
 * 管理数据统计和报表显示
 */

const StatsController = {
    // 当前选中的时间周期
    currentPeriod: 'day',
    
    // 周视图导航状态
    weekViewState: {
        currentWeekOffset: 0, // 0表示当前周，-1表示上一周，1表示下一周
        currentWeekStart: null, // 当前显示的周的开始日期
        currentWeekEnd: null, // 当前显示的周的结束日期
        isCurrentWeek: true // 标记是否当前正在显示的是本周
    },
    
    // 日视图导航状态
    dayViewState: {
        currentDayOffset: 0, // 0表示今天，-1表示昨天，1表示明天
        currentDay: new Date(), // 当前显示的日期
        isToday: true // 标记是否当前正在显示的是今天
    },
    
    // 月视图导航状态
    monthViewState: {
        currentMonthOffset: 0,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        isCurrentMonth: true
    },
    
    // 年视图导航状态
    yearViewState: {
        currentYearOffset: 0,
        currentYear: new Date().getFullYear(),
        isCurrentYear: true
    },
    
    /**
     * 初始化统计控制器
     */
    init() {
        // 初始化视图状态
        this.dayViewState = {
            currentDayOffset: 0,
            currentDay: new Date(), // 今天
            isToday: true
        };
        
        this.weekViewState = {
            currentWeekOffset: 0,
            currentWeekStart: Utils.getWeekStartDate(),
            currentWeekEnd: new Date(), // 今天
            isCurrentWeek: true
        };
        
        this.monthViewState = {
            currentMonthOffset: 0,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            isCurrentMonth: true
        };
        
        this.yearViewState = {
            currentYearOffset: 0,
            currentYear: new Date().getFullYear(),
            isCurrentYear: true
        };
        
        // 初始化周期按钮
        this.setupPeriodButtons();
        
        // 更新统计数据
        this.updateStats();
        
        // 确保日视图导航按钮在初始化时被创建
        this.updateDayNavigationButtons();
    },
    
    /**
     * 设置周期按钮切换事件
     */
    setupPeriodButtons() {
        const periodButtons = document.querySelectorAll('.stats-period-btn');
        periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有按钮的激活状态
                periodButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.add('bg-gray-200');
                    btn.classList.add('dark:bg-gray-700');
                    btn.classList.remove('bg-primary');
                    btn.classList.add('text-gray-700');
                    btn.classList.add('dark:text-gray-300');
                    btn.classList.remove('text-white');
                });
                
                // 激活当前按钮
                button.classList.add('active');
                button.classList.remove('bg-gray-200');
                button.classList.add('bg-primary');
                button.classList.remove('text-gray-700');
                button.classList.add('text-white');
                
                // 获取并设置当前选中的周期
                this.currentPeriod = button.getAttribute('data-period');
                
                // 显示对应的数据内容
                this.showPeriodContent(this.currentPeriod);
                
                // 更新统计数据
                this.updateStats();
            });
        });
    },
    
    /**
     * 显示指定周期的内容
     * @param {string} period - 周期类型: day, week, month, year
     */
    showPeriodContent(period) {
        this.currentPeriod = period;
        
        // 首先隐藏所有期间内容
        document.querySelectorAll('.stats-period-content').forEach(el => {
            el.classList.add('hidden');
        });
        
        // 清理所有图表相关资源
        this.cleanupCharts();
        
        // 显示选中的期间内容
        const contentEl = document.getElementById(`stats-${period}`);
        if (contentEl) {
            contentEl.classList.remove('hidden');
        }
        
        // 如果切换到周视图，重置周视图状态为当前周
        if (period === 'week') {
            this.resetWeekViewToCurrentWeek();
        }
        
        // 如果切换到日视图，重置日视图状态为今天
        if (period === 'day') {
            this.resetDayViewToToday();
        }
        // 如果切换到月视图，重置月视图状态为当前月
        else if (period === 'month') {
            this.resetMonthViewToCurrentMonth();
        }
        // 如果切换到年视图，重置年视图状态为当前年
        else if (period === 'year') {
            this.resetYearViewToCurrentYear();
        } else {
            // 更新其他周期的统计数据
            this.updateStats();
        }
    },
    
    /**
     * 重置周视图到当前周
     */
    resetWeekViewToCurrentWeek() {
        this.weekViewState = {
            currentWeekOffset: 0,
            currentWeekStart: Utils.getWeekStartDate(),
            currentWeekEnd: new Date(), // 本周截止到今天
            isCurrentWeek: true
        };
        
        // 更新标题文本
        const titleEl = document.getElementById('stats-week-header');
        if (titleEl) {
            titleEl.textContent = '本周数据';
        }
        
        // 更新周概览标题
        const overviewTitleEl = document.getElementById('stats-week-overview-title');
        if (overviewTitleEl) {
            overviewTitleEl.textContent = '本周概览';
        }
        
        // 更新周统计数据
        this.updateWeekStats();
        
        // 更新周导航按钮状态
        this.updateWeekNavigationButtons();
    },
    
    /**
     * 更新周导航按钮状态
     */
    updateWeekNavigationButtons() {
        const weekHeader = document.getElementById('stats-week-header');
        
        // 如果周导航按钮容器不存在，则创建
        let weekNavContainer = document.getElementById('week-nav-container');
        
        if (!weekNavContainer) {
            // 检查标题容器是否存在
            if (!weekHeader) return;
            
            // 创建一个水平flex容器，包含标题和导航按钮
            const headerContainer = document.createElement('div');
            headerContainer.className = 'flex items-center justify-between mb-2';
            
            // 移动原标题到新容器
            const titleEl = document.createElement('div');
            titleEl.className = 'text-lg font-medium';
            titleEl.id = 'stats-week-header';
            titleEl.textContent = this.weekViewState?.isCurrentWeek ? '本周数据' : '历史数据';
            headerContainer.appendChild(titleEl);
            
            // 创建导航按钮容器
            weekNavContainer = document.createElement('div');
            weekNavContainer.id = 'week-nav-container';
            weekNavContainer.className = 'flex items-center space-x-2';
            
            // 创建上一周按钮
            const prevWeekBtn = document.createElement('button');
            prevWeekBtn.id = 'prev-week-btn';
            prevWeekBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            prevWeekBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
            prevWeekBtn.title = '查看上一周';
            prevWeekBtn.addEventListener('click', () => this.navigateWeek(-1));
            weekNavContainer.appendChild(prevWeekBtn);
            
            // 创建回到当前周按钮
            const currentWeekBtn = document.createElement('button');
            currentWeekBtn.id = 'current-week-btn';
            currentWeekBtn.className = 'hidden p-1 px-2 text-xs rounded bg-primary text-white hover:bg-indigo-600 transition-colors';
            currentWeekBtn.textContent = '回到本周';
            currentWeekBtn.addEventListener('click', () => {
                this.resetWeekViewToCurrentWeek();
                this.updateWeekStats();
            });
            weekNavContainer.appendChild(currentWeekBtn);
            
            // 创建下一周按钮
            const nextWeekBtn = document.createElement('button');
            nextWeekBtn.id = 'next-week-btn';
            nextWeekBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            nextWeekBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
            nextWeekBtn.title = '查看下一周';
            nextWeekBtn.addEventListener('click', () => this.navigateWeek(1));
            weekNavContainer.appendChild(nextWeekBtn);
            
            headerContainer.appendChild(weekNavContainer);
            
            // 将新的标题容器插入到原标题位置
            weekHeader.parentNode.replaceChild(headerContainer, weekHeader);
        }
        
        // 更新导航按钮状态
        const currentWeekBtn = document.getElementById('current-week-btn');
        const nextWeekBtn = document.getElementById('next-week-btn');
        
        // 如果不是当前周，显示"回到本周"按钮
        if (currentWeekBtn) {
            if (this.weekViewState.isCurrentWeek) {
                currentWeekBtn.classList.add('hidden');
            } else {
                currentWeekBtn.classList.remove('hidden');
            }
        }
        
        // 如果是未来周，禁用"下一周"按钮
        if (nextWeekBtn) {
            const today = new Date();
            const weekEnd = this.weekViewState.currentWeekEnd;
            
            if (weekEnd > today) {
                nextWeekBtn.classList.add('opacity-50', 'cursor-not-allowed');
                nextWeekBtn.disabled = true;
            } else {
                nextWeekBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                nextWeekBtn.disabled = false;
            }
        }
    },
    
    /**
     * 导航到上一周或下一周
     * @param {number} direction - 导航方向，-1为上一周，1为下一周
     */
    navigateWeek(direction) {
        // 计算新的周偏移量
        const newOffset = this.weekViewState.currentWeekOffset + direction;
        
        // 获取对应的周一日期
        const today = new Date();
        const newWeekStart = Utils.getOffsetWeekStartDate(today, newOffset);
        
        // 计算周结束日期（周日）
        const newWeekEnd = new Date(newWeekStart);
        newWeekEnd.setDate(newWeekStart.getDate() + 6); // 周一+6天=周日
        
        // 如果是未来周，不允许导航
        if (direction > 0 && newWeekStart > today) {
            return;
        }
        
        // 如果结束日期超过今天，则截断到今天
        const adjustedWeekEnd = newWeekEnd > today ? today : newWeekEnd;
        
        // 更新状态
        this.weekViewState = {
            currentWeekOffset: newOffset,
            currentWeekStart: newWeekStart,
            currentWeekEnd: adjustedWeekEnd,
            isCurrentWeek: newOffset === 0
        };
        
        // 更新标题文本
        const titleEl = document.getElementById('stats-week-header');
        if (titleEl) {
            titleEl.textContent = this.weekViewState.isCurrentWeek ? '本周数据' : '历史数据';
        }
        
        // 更新周概览标题
        const overviewTitleEl = document.getElementById('stats-week-overview-title');
        if (overviewTitleEl) {
            overviewTitleEl.textContent = this.weekViewState.isCurrentWeek ? '本周概览' : '历史概览';
        }
        
        // 更新周统计数据
        this.updateWeekStats();
        
        // 更新导航按钮状态
        this.updateWeekNavigationButtons();
    },
    
    /**
     * 重置日视图到今天
     */
    resetDayViewToToday() {
        this.dayViewState = {
            currentDayOffset: 0,
            currentDay: new Date(), // 今天
            isToday: true
        };
        
        // 更新标题文本
        const titleEl = document.querySelector('#stats-day .text-lg.font-medium');
        if (titleEl) {
            titleEl.textContent = '今日数据';
        }
        
        // 更新时间线标题
        const timelineTitleEl = document.getElementById('stats-day-timeline-title');
        if (timelineTitleEl) {
            timelineTitleEl.textContent = '今日时间线';
        }
        
        // 更新日统计数据
        this.updateDayStats();
        
        // 更新日导航按钮状态
        this.updateDayNavigationButtons();
    },
    
    /**
     * 更新日导航按钮状态
     */
    updateDayNavigationButtons() {
        const dayHeader = document.querySelector('#stats-day .text-lg.font-medium');
        
        // 如果日导航按钮容器不存在，则创建
        let dayNavContainer = document.getElementById('day-nav-container');
        
        if (!dayNavContainer) {
            // 检查标题容器是否存在
            if (!dayHeader) return;
            
            // 创建一个水平flex容器，包含标题和导航按钮
            const headerContainer = document.createElement('div');
            headerContainer.className = 'flex items-center justify-between mb-2';
            headerContainer.id = 'stats-day-header';
            
            // 移动原标题到新容器
            const titleEl = document.createElement('div');
            titleEl.className = 'text-lg font-medium';
            titleEl.textContent = this.dayViewState?.isToday ? '今日数据' : '历史数据';
            headerContainer.appendChild(titleEl);
            
            // 创建导航按钮容器
            dayNavContainer = document.createElement('div');
            dayNavContainer.id = 'day-nav-container';
            dayNavContainer.className = 'flex items-center space-x-2';
            
            // 创建前一天按钮
            const prevDayBtn = document.createElement('button');
            prevDayBtn.id = 'prev-day-btn';
            prevDayBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            prevDayBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
            prevDayBtn.title = '查看前一天';
            prevDayBtn.addEventListener('click', () => this.navigateDay(-1));
            dayNavContainer.appendChild(prevDayBtn);
            
            // 创建回到今天按钮
            const todayBtn = document.createElement('button');
            todayBtn.id = 'today-btn';
            todayBtn.className = 'hidden p-1 px-2 text-xs rounded bg-primary text-white hover:bg-indigo-600 transition-colors';
            todayBtn.textContent = '回到今天';
            todayBtn.addEventListener('click', () => {
                this.resetDayViewToToday();
                this.updateDayStats();
            });
            dayNavContainer.appendChild(todayBtn);
            
            // 创建下一天按钮
            const nextDayBtn = document.createElement('button');
            nextDayBtn.id = 'next-day-btn';
            nextDayBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            nextDayBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
            nextDayBtn.title = '查看下一天';
            nextDayBtn.addEventListener('click', () => this.navigateDay(1));
            dayNavContainer.appendChild(nextDayBtn);
            
            headerContainer.appendChild(dayNavContainer);
            
            // 将新的标题容器插入到原标题位置
            dayHeader.parentNode.replaceChild(headerContainer, dayHeader);
            
            // 日期显示行现在已经存在于HTML中，无需动态创建
            // 只需确保ID为stats-day-date的元素存在即可
        }
        
        // 更新导航按钮状态
        const todayBtn = document.getElementById('today-btn');
        const nextDayBtn = document.getElementById('next-day-btn');
        
        // 如果不是今天，显示"回到今天"按钮
        if (todayBtn) {
            if (this.dayViewState.isToday) {
                todayBtn.classList.add('hidden');
            } else {
                todayBtn.classList.remove('hidden');
            }
        }
        
        // 如果是未来日，禁用"下一天"按钮
        if (nextDayBtn) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const currentDay = new Date(this.dayViewState.currentDay);
            currentDay.setHours(0, 0, 0, 0);
            
            if (currentDay >= today) {
                nextDayBtn.classList.add('opacity-50', 'cursor-not-allowed');
                nextDayBtn.disabled = true;
            } else {
                nextDayBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                nextDayBtn.disabled = false;
            }
        }
    },
    
    /**
     * 导航到前一天或后一天
     * @param {number} direction - 导航方向，-1为前一天，1为后一天
     */
    navigateDay(direction) {
        // 计算新的日偏移量
        const newOffset = this.dayViewState.currentDayOffset + direction;
        
        // 获取对应的日期
        const today = new Date();
        const newDay = new Date(today);
        newDay.setDate(today.getDate() + newOffset);
        
        // 如果是未来日，不允许导航
        if (direction > 0 && newDay > today) {
            return;
        }
        
        // 更新状态
        this.dayViewState = {
            currentDayOffset: newOffset,
            currentDay: newDay,
            isToday: newOffset === 0
        };
        
        // 更新标题文本
        const titleEl = document.querySelector('#stats-day .text-lg.font-medium');
        if (titleEl) {
            titleEl.textContent = this.dayViewState.isToday ? '今日数据' : '历史数据';
        }
        
        // 更新时间线标题
        const timelineTitleEl = document.getElementById('stats-day-timeline-title');
        if (timelineTitleEl) {
            timelineTitleEl.textContent = this.dayViewState.isToday ? '今日时间线' : '历史时间线';
        }
        
        // 更新日统计数据
        this.updateDayStats();
        
        // 更新导航按钮状态
        this.updateDayNavigationButtons();
    },
    
    /**
     * 更新统计数据
     */
    updateStats() {
        // 根据当前选中的周期更新对应的统计数据
        switch (this.currentPeriod) {
            case 'day':
                this.updateDayStats();
                break;
            case 'week':
                this.updateWeekStats();
                break;
            case 'month':
                this.updateMonthStats();
                break;
            case 'year':
                this.updateYearStats();
                break;
        }
    },
    
    /**
     * 更新日统计数据
     */
    updateDayStats() {
        // 获取当前显示的日期（今天或历史日期）
        const displayDate = this.dayViewState?.currentDay || new Date();
        const dateStr = Utils.formatDate(displayDate);
        const isToday = this.dayViewState ? this.dayViewState.isToday : true;
        
        // 更新日期显示
        document.getElementById('stats-day-date').textContent = dateStr;
        
        // 获取工作时长和加班时长
        let workDuration, overtime;
        
        if (isToday) {
            // 如果是今天，使用TimerService的实时计算
            workDuration = TimerService.calculateTodayWorkDuration();
            overtime = TimerService.calculateTodayOvertime();
        } else {
            // 如果是历史日期，从存储中获取
            const dailyRecord = Store.getDailyRecord(dateStr);
            
            // 初始化工作时长和加班时长
            workDuration = { hours: 0, minutes: 0 };
            overtime = { hours: 0, minutes: 0 };
            
            if (dailyRecord) {
                if (Array.isArray(dailyRecord)) {
                    // 多条记录情况 - 根据当前设置动态计算每条记录的工作时长
                    let totalWorkMinutes = 0;
                    
                    dailyRecord.forEach(record => {
                        let recordWorkMinutes = 0;
                        
                        // 判断是否有原始记录数据
                        if (record.rawHours !== undefined && record.rawMinutes !== undefined && record.breakMinutes !== undefined) {
                            // 计算原始时间（分钟）
                            const rawTotalMinutes = record.rawHours * 60 + record.rawMinutes;
                            
                            // 根据当前设置计算实际工作时间
                            if (CONFIG.EXCLUDE_BREAK_TIME) {
                                // 有午休设置时，需要扣除午休时间
                                if (rawTotalMinutes > record.breakMinutes) {
                                    recordWorkMinutes = rawTotalMinutes - record.breakMinutes;
                                } else {
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else {
                                // 无午休设置时，直接使用原始时间
                                recordWorkMinutes = rawTotalMinutes;
                            }
                        } else if (typeof record.workHours === 'number' && typeof record.workMinutes === 'number') {
                            // 向后兼容：如果没有原始时间数据，使用保存的工时
                            recordWorkMinutes = record.workHours * 60 + record.workMinutes;
                        }
                        
                        // 累加总工时
                        totalWorkMinutes += recordWorkMinutes;
                    });
                    
                    // 将总分钟数转为小时和分钟
                    workDuration.hours = Math.floor(totalWorkMinutes / 60);
                    workDuration.minutes = totalWorkMinutes % 60;
                    
                    // 计算加班时间 - 基于重新计算的总工时
                    const expectedWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
                    const totalOvertimeMinutes = Math.max(0, totalWorkMinutes - expectedWorkMinutes);
                    
                    overtime.hours = Math.floor(totalOvertimeMinutes / 60);
                    overtime.minutes = totalOvertimeMinutes % 60;
                } else {
                    // 单条记录情况，也需要根据当前设置重新计算
                    let totalWorkMinutes = 0;
                    
                    // 判断是否有原始记录数据
                    if (dailyRecord.rawHours !== undefined && dailyRecord.rawMinutes !== undefined && dailyRecord.breakMinutes !== undefined) {
                        // 计算原始时间（分钟）
                        const rawTotalMinutes = dailyRecord.rawHours * 60 + dailyRecord.rawMinutes;
                        
                        // 根据当前设置计算实际工作时间
                        if (CONFIG.EXCLUDE_BREAK_TIME) {
                            // 有午休设置时，需要扣除午休时间
                            if (rawTotalMinutes > dailyRecord.breakMinutes) {
                                totalWorkMinutes = rawTotalMinutes - dailyRecord.breakMinutes;
                            } else {
                                totalWorkMinutes = rawTotalMinutes;
                            }
                        } else {
                            // 无午休设置时，直接使用原始时间
                            totalWorkMinutes = rawTotalMinutes;
                        }
                    } else {
                        // 向后兼容：如果没有原始时间数据，使用保存的工时
                        totalWorkMinutes = (dailyRecord.workHours || 0) * 60 + (dailyRecord.workMinutes || 0);
                    }
                    
                    // 将总分钟数转为小时和分钟
                    workDuration.hours = Math.floor(totalWorkMinutes / 60);
                    workDuration.minutes = totalWorkMinutes % 60;
                    
                    // 计算加班时间 - 基于重新计算的总工时
                    const expectedWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
                    const totalOvertimeMinutes = Math.max(0, totalWorkMinutes - expectedWorkMinutes);
                    
                    overtime.hours = Math.floor(totalOvertimeMinutes / 60);
                    overtime.minutes = totalOvertimeMinutes % 60;
                }
            }
        }
        
        // 记录日志，便于调试
        console.log('日统计数据:', {
            date: dateStr, 
            workDuration: workDuration,
            overtime: overtime,
            dailyRecord: Store.getDailyRecord(dateStr)
        });
        
        const expectedDuration = TimerService.calculateExpectedWorkDuration();
        
        // 更新工作时长显示
        document.getElementById('stats-day-duration').textContent = 
            `${workDuration.hours}小时${workDuration.minutes > 0 ? workDuration.minutes + '分钟' : ''}`;
        
        // 更新加班时长显示
        document.getElementById('stats-day-overtime').textContent = 
            overtime.hours > 0 || overtime.minutes > 0 ?
            `${overtime.hours}小时${overtime.minutes > 0 ? overtime.minutes + '分钟' : ''}` :
            '0小时';
            
        // 在附加信息中显示标准工作时间（可选）
        const dayDurationEl = document.getElementById('stats-day-duration');
        if (dayDurationEl.parentElement) {
            let standardTimeEl = document.getElementById('standard-time-info');
            if (!standardTimeEl) {
                standardTimeEl = document.createElement('div');
                standardTimeEl.id = 'standard-time-info';
                standardTimeEl.className = 'text-xs text-gray-500 mt-1';
                dayDurationEl.parentElement.appendChild(standardTimeEl);
            }
            
            // 计算上下班时间间隔和午休时间
            const startDate = new Date();
            startDate.setHours(CONFIG.WORK_HOURS.START_HOUR, CONFIG.WORK_HOURS.START_MINUTE, 0, 0);
            
            const endDate = new Date();
            endDate.setHours(CONFIG.WORK_HOURS.END_HOUR, CONFIG.WORK_HOURS.END_MINUTE, 0, 0);
            
            // 如果下班时间早于上班时间（跨天情况），调整下班时间到第二天
            if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }
            
            // 计算上下班时间之间的总时间（含午休）
            const totalDiff = Utils.calculateTimeDifference(startDate, endDate);
            const totalMinutes = totalDiff.hours * 60 + totalDiff.minutes;
            
            // 计算午休时间
            const standardMinutes = expectedDuration.hours * 60 + expectedDuration.minutes;
            const breakMinutes = totalMinutes - standardMinutes;
            
            // 将午休时间转换为小时和分钟
            const breakHours = Math.floor(breakMinutes / 60);
            const breakMinutesRemainder = breakMinutes % 60;
            
            // 显示标准工时信息，移除午休时间描述
            standardTimeEl.innerHTML = `标准工时：${expectedDuration.hours}小时${expectedDuration.minutes > 0 ? expectedDuration.minutes + '分钟' : ''}`;
        }
        
        // 更新时间线
        this.updateDayTimeline(displayDate);
        
        // 确保页面滚动到顶部，以便用户能看到完整的统计数据
        setTimeout(() => {
            document.getElementById('app-container').scrollTop = 0;
        }, 100);
    },
    
    /**
     * 更新日时间线
     * @param {Date} displayDate - 要显示的日期
     */
    updateDayTimeline(displayDate) {
        const timelineEl = document.getElementById('stats-day-timeline');
        
        // 如果时间线元素不存在，直接返回
        if (!timelineEl) {
            console.warn('时间线元素不存在，跳过时间线更新');
            return;
        }
        
        // 清空现有内容
        timelineEl.innerHTML = '';
        
        // 获取日期
        const dateStr = Utils.formatDate(displayDate);
        const today = new Date();
        const isToday = Utils.formatDate(today) === dateStr;
        
        // 用于存储所有记录（当前会话和历史记录）
        let allRecords = [];
        
        // 检查当前是否有活动的工作会话且是在看今天的数据
        if (isToday && TimerService.workStatus === CONFIG.STATUS.WORKING && TimerService.workStartTime) {
            // 创建当前会话的记录对象
            const currentSession = {
                type: 'current',
                displayStartTime: TimerService.workStartTime,
                startTime: TimerService.workStartTime.getTime(),
                status: CONFIG.STATUS.WORKING
            };
            
            // 将当前会话添加到记录列表
            allRecords.push(currentSession);
        }
        
        // 获取所选日期的历史记录
        const dailyRecord = Store.getDailyRecord(dateStr);
        if (dailyRecord) {
            // 处理多条记录的情况
            const historyRecords = Array.isArray(dailyRecord) ? dailyRecord : [dailyRecord];
            
            // 遍历历史记录，添加到allRecords数组
            historyRecords.forEach(record => {
                // 只有当历史记录不是当前会话的一部分时才添加
                // 通过检查开始时间来识别，允许1秒的误差
                const isSameAsCurrentSession = 
                    isToday &&
                    TimerService.workStatus === CONFIG.STATUS.WORKING &&
                    TimerService.workStartTime &&
                    Math.abs(record.startTime - TimerService.workStartTime.getTime()) < 1000;
                
                if (!isSameAsCurrentSession) {
                    // 创建历史记录对象
                    const historySession = {
                        type: 'history',
                        displayStartTime: new Date(record.startTime),
                        displayEndTime: new Date(record.endTime),
                        startTime: record.startTime,
                        endTime: record.endTime,
                        workHours: record.workHours,
                        workMinutes: record.workMinutes,
                        // 添加原始时间数据，用于根据当前设置动态计算工作时长
                        rawHours: record.rawHours,
                        rawMinutes: record.rawMinutes,
                        breakMinutes: record.breakMinutes,
                        excludedBreakTime: record.excludedBreakTime,
                        status: CONFIG.STATUS.COMPLETED,
                        editedManually: record.editedManually || false,
                        // 添加唯一标识，用于删除操作
                        sessionId: record.sessionId || record.startTime
                    };
                    
                    // 添加到记录列表
                    allRecords.push(historySession);
                }
            });
        }
        
        // 按开始时间降序排序，最新的记录显示在最前面
        allRecords.sort((a, b) => b.startTime - a.startTime);
        
        // 如果没有记录，显示无数据提示
        if (allRecords.length === 0) {
            const noDataElement = document.createElement('div');
            noDataElement.className = 'flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm italic p-6';
            noDataElement.textContent = '无数据';
            timelineEl.appendChild(noDataElement);
            return;
        }
        
        // 创建时间线容器
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'space-y-4';
        timelineEl.appendChild(timelineContainer);
        
        // 遍历所有记录并创建时间线项
        allRecords.forEach((session, index) => {
            // 创建记录项
            const sessionItem = document.createElement('div');
            sessionItem.className = 'bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm';
            
            // 创建记录标题和时间
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center';
            
            // 添加序号标签，从最新的记录开始倒数
            const recordCount = allRecords.length - index;
            let labelClass = 'inline-block px-2 py-0.5 rounded text-xs';
            let labelText = `记录 #${recordCount}`;
            
            // 当前会话特殊标记
            if (session.type === 'current') {
                labelClass += ' bg-primary text-white';
                labelText = '当前会话';
            } else {
                labelClass += ' bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200';
            }
            
            header.innerHTML = `
                <span class="${labelClass}">${labelText}</span>
                <span class="text-gray-500 text-sm">${Utils.formatDate(new Date(session.startTime))}</span>
            `;
            sessionItem.appendChild(header);
            
            // 添加上班打卡信息
            const startTimeInfo = document.createElement('div');
            startTimeInfo.className = 'mt-2 flex justify-between items-center';
            startTimeInfo.innerHTML = `
                <span class="flex items-center text-blue-600">
                    <i class="ri-login-circle-line mr-1"></i>上班打卡
                </span>
                <span class="text-gray-700">${Utils.formatTime(session.displayStartTime)}</span>
            `;
            sessionItem.appendChild(startTimeInfo);
            
            if (session.status === CONFIG.STATUS.WORKING) {
                // 计算当前已工作时长
                const duration = TimerService.calculateCurrentSessionDuration();
                
                // 添加当前状态
                const currentStatus = document.createElement('div');
                currentStatus.className = 'mt-2 flex justify-between items-center';
                currentStatus.innerHTML = `
                    <span class="flex items-center text-primary">
                        <i class="ri-play-circle-line mr-1"></i>工作中...
                    </span>
                    <span class="text-sm text-gray-600">${Utils.formatWorkDuration(duration.hours, duration.minutes)}</span>
                `;
                sessionItem.appendChild(currentStatus);
            } else {
                // 已下班 - 添加额外信息
                const endTimeInfo = document.createElement('div');
                endTimeInfo.className = 'mt-2 flex justify-between items-center';
                endTimeInfo.innerHTML = `
                    <span class="flex items-center text-emerald-600">
                        <i class="ri-logout-circle-line mr-1"></i>下班打卡
                    </span>
                    <span class="text-gray-700">${Utils.formatTime(session.displayEndTime)}</span>
                `;
                sessionItem.appendChild(endTimeInfo);
                
                // 添加工作时间统计
                // 根据当前的午休设置动态计算工作时长，而不是直接使用保存的值
                let workDuration;
                
                if (session.rawHours !== undefined && session.rawMinutes !== undefined && session.breakMinutes !== undefined) {
                    // 如果有原始时间数据和午休时间，根据当前设置动态计算
                    const rawTotalMinutes = session.rawHours * 60 + session.rawMinutes;
                    let adjustedWorkMinutes = rawTotalMinutes;
                    
                    // 根据当前午休设置计算，而不是使用记录时的设置
                    if (CONFIG.EXCLUDE_BREAK_TIME) {
                        // 只有当原始时间差超过午休时间，才减去午休时间
                        if (rawTotalMinutes > session.breakMinutes) {
                            adjustedWorkMinutes = rawTotalMinutes - session.breakMinutes;
                        }
                    }
                    
                    // 计算调整后的工时
                    workDuration = {
                        hours: Math.floor(adjustedWorkMinutes / 60),
                        minutes: adjustedWorkMinutes % 60
                    };
                } else if (session.workHours !== undefined && session.workMinutes !== undefined) {
                    // 没有原始数据时使用保存的工时（向后兼容）
                    workDuration = { 
                        hours: session.workHours, 
                        minutes: session.workMinutes 
                    };
                } else {
                    // 最终回退到直接计算差值
                    workDuration = Utils.calculateTimeDifference(session.displayStartTime, session.displayEndTime);
                }
                
                const durationInfo = document.createElement('div');
                durationInfo.className = 'mt-2 text-sm text-gray-600 flex justify-between';
                durationInfo.innerHTML = `
                    <span>工作时长:</span>
                    <span class="font-medium">${Utils.formatWorkDuration(workDuration.hours, workDuration.minutes)}</span>
                `;
                sessionItem.appendChild(durationInfo);
            }
            
            // 只为历史记录添加删除按钮，当前会话不能删除
            if (session.type === 'history') {
                const deleteButtonContainer = document.createElement('div');
                deleteButtonContainer.className = 'mt-3 flex justify-end';
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'text-xs text-red-500 hover:text-red-700 flex items-center';
                deleteButton.innerHTML = '<i class="ri-delete-bin-line mr-1"></i> 删除记录';
                
                // 添加删除点击事件
                deleteButton.addEventListener('click', () => {
                    this.deleteWorkRecord(dateStr, session.sessionId || session.startTime);
                });
                
                deleteButtonContainer.appendChild(deleteButton);
                sessionItem.appendChild(deleteButtonContainer);
            }
            
            // 添加到时间线容器
            timelineContainer.appendChild(sessionItem);
        });
    },
    
    /**
     * 删除工作记录
     * @param {string} dateStr - 日期字符串
     * @param {number} sessionId - 要删除的会话ID
     */
    deleteWorkRecord(dateStr, sessionId) {
        // 创建自定义确认弹窗
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
        confirmDialog.style.opacity = '0';
        confirmDialog.style.transition = 'opacity 0.2s ease';
        
        // 弹窗内容
        confirmDialog.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 max-w-xs w-full transform scale-95 transition-transform duration-200">
                <div class="text-center mb-4">
                    <i class="ri-delete-bin-6-line text-red-500 text-3xl mb-2"></i>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">确定要删除此条记录？</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">此操作无法撤销</p>
                </div>
                <div class="flex space-x-2">
                    <button id="confirm-cancel" class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-colors">
                        取消
                    </button>
                    <button id="confirm-delete" class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-white transition-colors">
                        删除
                    </button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(confirmDialog);
        
        // 动画显示
        setTimeout(() => {
            confirmDialog.style.opacity = '1';
            confirmDialog.querySelector('div').classList.remove('scale-95');
            confirmDialog.querySelector('div').classList.add('scale-100');
        }, 10);
        
        // 绑定事件
        const closeDialog = () => {
            confirmDialog.style.opacity = '0';
            confirmDialog.querySelector('div').classList.remove('scale-100');
            confirmDialog.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                document.body.removeChild(confirmDialog);
            }, 200);
        };
        
        // 取消按钮
        confirmDialog.querySelector('#confirm-cancel').addEventListener('click', closeDialog);
        
        // 点击背景关闭
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                closeDialog();
            }
        });
        
        // 确认删除
        confirmDialog.querySelector('#confirm-delete').addEventListener('click', () => {
            // 获取当前日期的所有记录
            const dailyRecord = Store.getDailyRecord(dateStr);
            
            if (!dailyRecord) {
                closeDialog();
                return;
            }
            
            let updatedRecords;
            
            if (Array.isArray(dailyRecord)) {
                // 过滤掉要删除的记录
                updatedRecords = dailyRecord.filter(record => {
                    // 使用sessionId或startTime作为唯一标识
                    const recordId = record.sessionId || record.startTime;
                    return recordId !== sessionId;
                });
            } else {
                // 如果只有一条记录，且是要删除的记录，则设置为空数组
                const recordId = dailyRecord.sessionId || dailyRecord.startTime;
                updatedRecords = (recordId === sessionId) ? [] : [dailyRecord];
            }
            
            // 获取所有记录
            const allRecords = Store.getAllRecords();
            
            // 更新当天的记录
            if (updatedRecords.length > 0) {
                allRecords[dateStr] = updatedRecords;
            } else {
                // 如果该天没有记录了，删除该天的键
                delete allRecords[dateStr];
            }
            
            // 保存更新后的记录
            Store.save(CONFIG.STORAGE_KEYS.DAILY_RECORDS, allRecords);
            
            // 关闭弹窗
            closeDialog();
            
            // 显示删除成功消息
            UIController.showToast('记录已删除');
            
            // 刷新时间线显示 - 传递当前查看的日期
            this.updateDayTimeline(this.dayViewState.currentDay);
            
            // 更新统计信息
            this.updateDayStats();
        });
    },
    
    /**
     * 更新周统计数据
     */
    updateWeekStats() {
        // 获取当前显示的周的开始和结束日期
        const weekStart = this.weekViewState.currentWeekStart || Utils.getWeekStartDate();
        const today = new Date();
        let weekEnd;
        
        if (this.weekViewState.isCurrentWeek) {
            // 当前周，结束日期为今天
            weekEnd = today;
        } else if (this.weekViewState.currentWeekEnd) {
            // 使用状态中保存的结束日期
            weekEnd = this.weekViewState.currentWeekEnd;
        } else {
            // 默认情况，设置为周日
            weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // 周一+6=周日
            
            // 如果结束日期超过今天，则截断到今天
            if (weekEnd > today) {
                weekEnd = today;
            }
        }
        
        // 更新周日期范围显示
        const weekDateStr = `${Utils.formatDate(weekStart)} ~ ${Utils.formatDate(weekEnd)}`;
        document.getElementById('stats-week-date').textContent = weekDateStr;
        
        // 获取指定周的工作记录
        const weekRecords = Store.getWeekRecordsByRange(weekStart, weekEnd);
        
        // 使用Map按日期分组，避免重复计算
        const dailyWorkMap = new Map();
        
        // 定义变量跟踪最长工作日的分钟数
        let maxDayWorkMinutes = 0;
        
        // 计算每天的工作时长，保存到Map中
        weekRecords.forEach(record => {
            const date = record.date;
            if (!dailyWorkMap.has(date)) {
                // 获取该日期的完整工时记录（使用TimerService方法获取准确的日工时）
                const dateObj = new Date(date);
                const dateStr = Utils.formatDate(dateObj);
                const todayRecords = Store.getDailyRecord(dateStr);
                
                if (todayRecords) {
                    let dayTotalWorkMinutes = 0;
                    let dayTotalOvertimeMinutes = 0;
                    
                    // 计算当天所有记录的总工时（与TimerService.calculateTodayWorkDuration逻辑类似）
                    if (Array.isArray(todayRecords)) {
                        todayRecords.forEach(dayRecord => {
                            let recordWorkMinutes = 0;
                            
                            // 判断是否有原始记录数据
                            if (dayRecord.rawHours !== undefined && dayRecord.rawMinutes !== undefined && dayRecord.breakMinutes !== undefined) {
                                // 计算原始时间（分钟）
                                const rawTotalMinutes = dayRecord.rawHours * 60 + dayRecord.rawMinutes;
                                
                                // 根据当前设置计算实际工作时间
                                if (CONFIG.EXCLUDE_BREAK_TIME) {
                                    // 有午休设置时，需要扣除午休时间
                                    if (rawTotalMinutes > dayRecord.breakMinutes) {
                                        recordWorkMinutes = rawTotalMinutes - dayRecord.breakMinutes;
                                    } else {
                                        recordWorkMinutes = rawTotalMinutes;
                                    }
                                } else {
                                    // 无午休设置时，直接使用原始时间
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else if (typeof dayRecord.workHours === 'number' && typeof dayRecord.workMinutes === 'number') {
                                // 向后兼容：如果没有原始时间数据，使用保存的工时
                                recordWorkMinutes = dayRecord.workHours * 60 + dayRecord.workMinutes;
                            }
                            
                            // 只累加工作时长，不单独计算每条记录的加班时间
                            dayTotalWorkMinutes += recordWorkMinutes;
                        });
                        
                        // 完成累加后，基于总工时计算加班时间
                        const expectedWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
                        dayTotalOvertimeMinutes = Math.max(0, dayTotalWorkMinutes - expectedWorkMinutes);
                    } else {
                        // 单条记录情况
                        let recordWorkMinutes = 0;
                        
                        // 判断是否有原始记录数据
                        if (todayRecords.rawHours !== undefined && todayRecords.rawMinutes !== undefined && todayRecords.breakMinutes !== undefined) {
                            // 计算原始时间（分钟）
                            const rawTotalMinutes = todayRecords.rawHours * 60 + todayRecords.rawMinutes;
                            
                            // 根据当前设置计算实际工作时间
                            if (CONFIG.EXCLUDE_BREAK_TIME) {
                                // 有午休设置时，需要扣除午休时间
                                if (rawTotalMinutes > todayRecords.breakMinutes) {
                                    recordWorkMinutes = rawTotalMinutes - todayRecords.breakMinutes;
                                } else {
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else {
                                // 无午休设置时，直接使用原始时间
                                recordWorkMinutes = rawTotalMinutes;
                            }
                        } else if (typeof todayRecords.workHours === 'number' && typeof todayRecords.workMinutes === 'number') {
                            // 向后兼容：如果没有原始时间数据，使用保存的工时
                            recordWorkMinutes = todayRecords.workHours * 60 + todayRecords.workMinutes;
                        }
                        
                        // 设置当天总工时
                        dayTotalWorkMinutes = recordWorkMinutes;
                        
                        // 基于计算的工作时长计算加班时间
                        const expectedWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
                        dayTotalOvertimeMinutes = Math.max(0, dayTotalWorkMinutes - expectedWorkMinutes);
                    }
                    
                    // 将当天总工时保存到Map中
                    dailyWorkMap.set(date, {
                        workMinutes: dayTotalWorkMinutes,
                        overtimeMinutes: dayTotalOvertimeMinutes
                    });
                    
                    // 更新最长工作日记录
                    if (dayTotalWorkMinutes > maxDayWorkMinutes) {
                        maxDayWorkMinutes = dayTotalWorkMinutes;
                    }
                }
            }
        });
        
        // 如果今天正在工作但还没有记录，且正在查看当前周，加上今天的数据
        if (TimerService.workStatus === CONFIG.STATUS.WORKING && this.weekViewState.isCurrentWeek) {
            const todayStr = Utils.formatDate(today);
            
            // 如果Map中没有今天的记录，或者需要更新今天的记录
            const todayDuration = TimerService.calculateTodayWorkDuration();
            const todayOvertime = TimerService.calculateTodayOvertime();
            
            const todayWorkMinutes = todayDuration.hours * 60 + todayDuration.minutes;
            const todayOvertimeMinutes = todayOvertime.hours * 60 + todayOvertime.minutes;
            
            // 将今天的工时添加到Map中
            dailyWorkMap.set(todayStr, {
                workMinutes: todayWorkMinutes,
                overtimeMinutes: todayOvertimeMinutes
            });
            
            // 更新最长工作日记录
            if (todayWorkMinutes > maxDayWorkMinutes) {
                maxDayWorkMinutes = todayWorkMinutes;
            }
        }
        
        // 计算总工作时长和加班时长
        let totalWorkMinutes = 0;
        let totalOvertimeMinutes = 0;
        
        // 记录调试日志，查看周数据计算过程
        console.log('周视图数据计算:', {
            weekRange: weekDateStr,
            excludeBreakTime: CONFIG.EXCLUDE_BREAK_TIME,
            dailyWorkMap: Array.from(dailyWorkMap.entries()),
            maxDayWorkMinutes: maxDayWorkMinutes
        });
        
        // 从Map中汇总所有日期的工时
        dailyWorkMap.forEach(dayData => {
            totalWorkMinutes += dayData.workMinutes;
            totalOvertimeMinutes += dayData.overtimeMinutes;
        });
        
        // 出勤天数就是Map的大小
        const attendanceDaysCount = dailyWorkMap.size;
        
        // 计算平均每日工时
        const avgDailyMinutes = attendanceDaysCount > 0 ? Math.round(totalWorkMinutes / attendanceDaysCount) : 0;
        const avgDailyHours = Math.floor(avgDailyMinutes / 60);
        const avgDailyMinutesRemainder = avgDailyMinutes % 60;
        
        // 更新显示
        document.getElementById('stats-week-duration').textContent = 
            `${Math.floor(totalWorkMinutes / 60)}小时${totalWorkMinutes % 60 > 0 ? (totalWorkMinutes % 60) + '分钟' : ''}`;
        
        document.getElementById('stats-week-overtime').textContent = 
            `${Math.floor(totalOvertimeMinutes / 60)}小时${totalOvertimeMinutes % 60 > 0 ? (totalOvertimeMinutes % 60) + '分钟' : ''}`;
        
        document.getElementById('stats-week-avg').textContent = 
            `${avgDailyHours}小时${avgDailyMinutesRemainder > 0 ? avgDailyMinutesRemainder + '分钟' : ''}`;
        
        document.getElementById('stats-week-days').textContent = 
            `${attendanceDaysCount}天`;
        
        // 更新周图表
        this.updateWeekChart(weekRecords, dailyWorkMap);
    },
    
    /**
     * 更新周图表显示
     * @param {Array} records - 周工作记录
     * @param {Map} dailyWorkMap - 按日期存储的工作数据Map
     */
    updateWeekChart(records, dailyWorkMap) {
        const chartEl = document.getElementById('stats-week-chart');
        
        // 添加调试日志
        console.log('周图表数据:', { 
            records: records, 
            dailyWorkMap: Array.from(dailyWorkMap.entries()),
            weekViewState: this.weekViewState
        });
        
        // 清除旧图表
        chartEl.innerHTML = '';
        
        // 如果没有记录或者所有日期的工作时间都是0，显示"无数据"提示
        const hasValidData = Array.from(dailyWorkMap.values()).some(day => day.workMinutes > 0);
        const isCurrentWeekWithOngoingWork = this.weekViewState.isCurrentWeek && TimerService.workStatus === CONFIG.STATUS.WORKING && TimerService.workStartTime;
        
        if ((!hasValidData && !isCurrentWeekWithOngoingWork) || records.length === 0) {
            chartEl.innerHTML = '<div class="flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm italic h-full w-full p-6">无数据</div>';
            return;
        }
        
        // 创建外层容器，与月度和年度趋势图保持结构一致
        const chartContainer = document.createElement('div');
        chartContainer.className = 'w-full';
        chartContainer.style.minHeight = '300px';
        
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        canvas.id = 'week-chart-canvas';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        chartContainer.appendChild(canvas);
        
        // 将图表容器添加到DOM
        chartEl.appendChild(chartContainer);
        
        // 检测当前是否为暗色模式
        const isDarkMode = document.documentElement.classList.contains('dark') || 
                          (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        // 设置颜色方案
        const colors = {
            // 标准工时颜色
            standardWork: {
                background: isDarkMode ? '#4C6EF5' : '#4F46E5', // 标准工时蓝色
                border: isDarkMode ? '#3B5BDB' : '#4338CA',
                hover: isDarkMode ? '#5C7CFA' : '#6366F1'
            },
            // 加班时间颜色
            overtime: {
                background: isDarkMode ? '#F87171' : '#EF4444', // 加班时间红色
                border: isDarkMode ? '#DC2626' : '#DC2626',
                hover: isDarkMode ? '#FCA5A5' : '#FCA5A5'
            },
            // 其他UI颜色
            grid: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(226, 232, 240, 0.6)', // 网格线
            text: isDarkMode ? '#D1D5DB' : '#4B5563', // 文本颜色
            tooltip: {
                background: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(249, 250, 251, 0.9)',
                title: isDarkMode ? '#F9FAFB' : '#111827',
                text: isDarkMode ? '#F3F4F6' : '#374151',
                border: isDarkMode ? '#4B5563' : '#E5E7EB'
            }
        };
        
        // 获取周一到周日的日期，使用weekViewState中的日期范围
        const weekDays = [];
        // 使用当前选中周的开始日期，而不是固定当前周
        const monday = this.weekViewState?.currentWeekStart || Utils.getWeekStartDate();
        const today = new Date();
        const todayStr = Utils.formatDate(today);
        
        // 处理日期和标签
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const dateStr = Utils.formatDate(day);
            const isToday = dateStr === todayStr;
            
            const monthName = day.toLocaleString('zh-CN', { month: 'short' }).replace('月', '');
            const dayOfMonth = day.getDate();
            
            weekDays.push({
                date: dateStr,
                dayOfWeek: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
                label: `${monthName}${dayOfMonth}`, // 格式：3月15
                isToday: isToday,
                isWeekend: i >= 5 // 周六和周日
            });
        }
        
        // 准备图表数据，分为标准工时和加班两部分
        const standardWorkData = [];
        const overtimeData = [];
        
        // 使用dailyWorkMap中已经计算好的准确工时数据
        weekDays.forEach(day => {
            // 从dailyWorkMap中获取当天的工时数据
            const dayData = dailyWorkMap.get(day.date);
            
            // 计算工作时长（小时）和加班时长（小时）
            let standardWorkHours = 0;
            let overtimeHours = 0;
            
            if (dayData) {
                const standardWorkMinutes = Math.min(dayData.workMinutes, CONFIG.WORK_HOURS.STANDARD_HOURS * 60);
                standardWorkHours = parseFloat((standardWorkMinutes / 60).toFixed(2));
                
                overtimeHours = parseFloat((dayData.overtimeMinutes / 60).toFixed(2));
            } else if (day.date === todayStr && TimerService.workStatus === CONFIG.STATUS.WORKING && this.weekViewState.isCurrentWeek) {
                // 如果是今天且正在工作，并且是查看当前周的视图，才计算当前工作状态
                const todayDuration = TimerService.calculateTodayWorkDuration();
                const todayOvertime = TimerService.calculateTodayOvertime();
                
                standardWorkHours = Math.min(
                    parseFloat(((todayDuration.hours * 60 + todayDuration.minutes) / 60).toFixed(2)), 
                    CONFIG.WORK_HOURS.STANDARD_HOURS
                );
                
                overtimeHours = parseFloat(((todayOvertime.hours * 60 + todayOvertime.minutes) / 60).toFixed(2));
            }
            
            standardWorkData.push(standardWorkHours);
            overtimeData.push(overtimeHours);
        });
        
        // 准备图表数据
        const chartData = {
            labels: weekDays.map(day => day.dayOfWeek),
            datasets: [
                {
                    label: '标准工时',
                    data: standardWorkData,
                    backgroundColor: colors.standardWork.background,
                    borderColor: colors.standardWork.border,
                    borderWidth: 1,
                    borderRadius: 5,
                    hoverBackgroundColor: colors.standardWork.hover,
                    stack: 'Stack 0',
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: '加班时长',
                    data: overtimeData,
                    backgroundColor: colors.overtime.background,
                    borderColor: colors.overtime.border,
                    borderWidth: 1,
                    borderRadius: 5,
                    hoverBackgroundColor: colors.overtime.hover,
                    stack: 'Stack 0',
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        };
        
        // 创建图表配置
        const chartConfig = {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            boxWidth: 10,
                            color: colors.text,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: colors.tooltip.background,
                        titleColor: colors.tooltip.title,
                        bodyColor: colors.tooltip.text,
                        borderColor: colors.tooltip.border,
                        borderWidth: isDarkMode ? 0 : 1,
                        cornerRadius: 6,
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        displayColors: true,
                        boxWidth: 10,
                        boxHeight: 10,
                        boxPadding: 3,
                        usePointStyle: true,
                        callbacks: {
                            title: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const day = weekDays[index];
                                return `${day.dayOfWeek} (${day.date})`;
                            },
                            label: function(context) {
                                const value = context.raw;
                                if (value === 0) return null;
                                
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                
                                let text = context.dataset.label + ': ';
                                if (hours > 0 || minutes > 0) {
                                    text += hours > 0 ? `${hours}小时` : '';
                                    text += minutes > 0 ? `${minutes}分钟` : '';
                                } else {
                                    text += '0小时';
                                }
                                
                                return text;
                            },
                            afterBody: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const day = weekDays[index];
                                const dayData = dailyWorkMap.get(day.date);
                                
                                if (!dayData || dayData.workMinutes === 0) return null;
                                
                                const totalWorkMinutes = dayData.workMinutes;
                                const hours = Math.floor(totalWorkMinutes / 60);
                                const minutes = totalWorkMinutes % 60;
                                
                                return [`总工时: ${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: colors.text,
                            font: {
                                size: 12
                            },
                            padding: 5
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: colors.grid,
                            drawBorder: false
                        },
                        border: {
                            dash: [4, 4]
                        },
                        ticks: {
                            padding: 8,
                            color: colors.text,
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + 'h';
                            },
                            stepSize: 4
                        },
                        suggestedMax: Math.ceil(Math.max(
                            CONFIG.WORK_HOURS.STANDARD_HOURS,
                            ...standardWorkData.map((std, i) => std + overtimeData[i])
                        )) + 2
                    }
                },
                layout: {
                    padding: {
                        top: 30,
                        right: 25,
                        bottom: 25,
                        left: 15
                    }
                }
            }
        };
        
        // 创建图表
        new Chart(canvas, chartConfig);
        
        // 当主题改变时更新图表
        const updateChartOnThemeChange = () => {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleThemeChange = () => {
                setTimeout(() => {
                    this.updateWeekChart(records, dailyWorkMap);
                }, 100);
            };
            
            // 使用更现代的事件监听方式
            try {
                darkModeMediaQuery.addEventListener('change', handleThemeChange);
                
                // 添加DOM类变化监听（针对手动切换主题）
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'class' && 
                            mutation.target === document.documentElement) {
                            handleThemeChange();
                        }
                    });
                });
                
                observer.observe(document.documentElement, { 
                    attributes: true, 
                    attributeFilter: ['class'] 
                });
                
                // 返回清理函数
                return () => {
                    darkModeMediaQuery.removeEventListener('change', handleThemeChange);
                    observer.disconnect();
                };
            } catch (e) {
                // 兼容旧版浏览器
                console.log("使用兼容方式监听主题变化");
                darkModeMediaQuery.addListener(handleThemeChange);
                
                return () => {
                    darkModeMediaQuery.removeListener(handleThemeChange);
                };
            }
        };
        
        // 启动主题变化监听
        this.weekChartThemeCleanup = updateChartOnThemeChange();
    },
    
    /**
     * 更新月统计数据
     */
    updateMonthStats() {
        // 获取当前选择的月份
        const { currentYear, currentMonth, isCurrentMonth } = this.monthViewState;
        
        // 更新月份显示
        const monthStr = `${currentYear}年${currentMonth + 1}月`;
        document.getElementById('stats-month-date').textContent = monthStr;
        
        // 获取指定月份的工作记录
        const monthRecords = isCurrentMonth 
            ? Store.getMonthRecords() 
            : Store.getMonthRecordsByDate(new Date(currentYear, currentMonth, 1));
        
        // 使用Map按日期分组，避免重复计算
        const dailyWorkMap = new Map();
        let maxDayWorkMinutes = 0; // 跟踪最长工作日的分钟数
        
        // 计算每天的工作时长，保存到Map中
        monthRecords.forEach(record => {
            const date = record.date;
            if (!dailyWorkMap.has(date)) {
                // 获取该日期的完整工时记录
                const dateObj = new Date(date);
                const dateStr = Utils.formatDate(dateObj);
                
                // 添加调试日志
                console.log('处理日期记录:', {
                    originalDate: date,
                    dateObj: dateObj,
                    dateStr: dateStr,
                    month: dateObj.getMonth() + 1,
                    year: dateObj.getFullYear(),
                    day: dateObj.getDate()
                });
                
                const todayRecords = Store.getDailyRecord(dateStr);
                
                if (todayRecords) {
                    let dayTotalWorkMinutes = 0;
                    let dayTotalOvertimeMinutes = 0;
                    
                    // 计算当天所有记录的总工时
                    if (Array.isArray(todayRecords)) {
                        todayRecords.forEach(dayRecord => {
                            let recordWorkMinutes = 0;
                            
                            // 判断是否有原始记录数据
                            if (dayRecord.rawHours !== undefined && dayRecord.rawMinutes !== undefined && dayRecord.breakMinutes !== undefined) {
                                // 计算原始时间（分钟）
                                const rawTotalMinutes = dayRecord.rawHours * 60 + dayRecord.rawMinutes;
                                
                                // 根据当前设置计算实际工作时间
                                if (CONFIG.EXCLUDE_BREAK_TIME) {
                                    // 有午休设置时，需要扣除午休时间
                                    if (rawTotalMinutes > dayRecord.breakMinutes) {
                                        recordWorkMinutes = rawTotalMinutes - dayRecord.breakMinutes;
                                    } else {
                                        recordWorkMinutes = rawTotalMinutes;
                                    }
                                } else {
                                    // 无午休设置时，直接使用原始时间
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else if (typeof dayRecord.workHours === 'number' && typeof dayRecord.workMinutes === 'number') {
                                // 向后兼容：如果没有原始时间数据，使用保存的工时
                                recordWorkMinutes = dayRecord.workHours * 60 + dayRecord.workMinutes;
                            }
                            
                            // 累加总工时
                            dayTotalWorkMinutes += recordWorkMinutes;
                            
                            // 计算加班时间
                            const expectedWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
                            const recordOvertimeMinutes = Math.max(0, recordWorkMinutes - expectedWorkMinutes);
                            dayTotalOvertimeMinutes += recordOvertimeMinutes;
                        });
                        
                        // 完成累加后，基于总工时计算加班时间
                        const expectedWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
                        dayTotalOvertimeMinutes = Math.max(0, dayTotalWorkMinutes - expectedWorkMinutes);
                    } else {
                        // 单条记录情况
                        let recordWorkMinutes = 0;
                        let recordOvertimeMinutes = 0;
                        
                        // 判断是否有原始记录数据
                        if (todayRecords.rawHours !== undefined && todayRecords.rawMinutes !== undefined && todayRecords.breakMinutes !== undefined) {
                            // 计算原始时间（分钟）
                            const rawTotalMinutes = todayRecords.rawHours * 60 + todayRecords.rawMinutes;
                            
                            // 根据当前设置计算实际工作时间
                            if (CONFIG.EXCLUDE_BREAK_TIME) {
                                // 有午休设置时，需要扣除午休时间
                                if (rawTotalMinutes > todayRecords.breakMinutes) {
                                    recordWorkMinutes = rawTotalMinutes - todayRecords.breakMinutes;
                                } else {
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else {
                                // 无午休设置时，直接使用原始时间
                                recordWorkMinutes = rawTotalMinutes;
                            }
                        } else if (typeof todayRecords.workHours === 'number' && typeof todayRecords.workMinutes === 'number') {
                            // 向后兼容：如果没有原始时间数据，使用保存的工时
                            recordWorkMinutes = todayRecords.workHours * 60 + todayRecords.workMinutes;
                        }
                        
                        // 设置当天总工时
                        dayTotalWorkMinutes = recordWorkMinutes;
                        
                        // 基于计算的工作时长计算加班时间
                        const expectedWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
                        dayTotalOvertimeMinutes = Math.max(0, dayTotalWorkMinutes - expectedWorkMinutes);
                    }
                    
                    // 将当天总工时保存到Map中
                    dailyWorkMap.set(date, {
                        workMinutes: dayTotalWorkMinutes,
                        overtimeMinutes: dayTotalOvertimeMinutes
                    });
                    
                    // 更新最长工作日记录
                    if (dayTotalWorkMinutes > maxDayWorkMinutes) {
                        maxDayWorkMinutes = dayTotalWorkMinutes;
                    }
                }
            }
        });
        
        // 如果今天正在工作但还没有记录，且正在查看当前月，加上今天的数据
        if (TimerService.workStatus === CONFIG.STATUS.WORKING && isCurrentMonth) {
            const today = new Date();
            const todayStr = Utils.formatDate(today);
            
            // 计算当前工作中的工时
            const todayDuration = TimerService.calculateTodayWorkDuration();
            const todayOvertime = TimerService.calculateTodayOvertime();
            
            const todayWorkMinutes = todayDuration.hours * 60 + todayDuration.minutes;
            const todayOvertimeMinutes = todayOvertime.hours * 60 + todayOvertime.minutes;
            
            // 将今天的工时添加/更新到Map中
            dailyWorkMap.set(todayStr, {
                workMinutes: todayWorkMinutes,
                overtimeMinutes: todayOvertimeMinutes
            });
            
            // 更新最长工作日记录
            if (todayWorkMinutes > maxDayWorkMinutes) {
                maxDayWorkMinutes = todayWorkMinutes;
            }
        }
        
        // 计算总工作时长和加班时长
        let totalWorkMinutes = 0;
        let totalOvertimeMinutes = 0;
        
        // 添加调试日志，记录月视图数据计算过程
        console.log('月视图数据计算:', {
            month: monthStr,
            excludeBreakTime: CONFIG.EXCLUDE_BREAK_TIME,
            dailyWorkMap: Array.from(dailyWorkMap.entries()),
        });
        
        // 从Map中汇总所有日期的工时
        dailyWorkMap.forEach(dayData => {
            totalWorkMinutes += dayData.workMinutes;
            totalOvertimeMinutes += dayData.overtimeMinutes;
        });
        
        // 出勤天数就是Map的大小
        const attendanceDaysCount = dailyWorkMap.size;
        
        // 计算日平均工时（基于实际出勤天数）
        const dailyAvgMinutes = attendanceDaysCount > 0 ? Math.round(totalWorkMinutes / attendanceDaysCount) : 0;
        const dailyAvgHours = Math.floor(dailyAvgMinutes / 60);
        const dailyAvgMinutesRemainder = dailyAvgMinutes % 60;
        
        // 更新显示
        document.getElementById('stats-month-duration').textContent = 
            `${Math.floor(totalWorkMinutes / 60)}小时${totalWorkMinutes % 60 > 0 ? (totalWorkMinutes % 60) + '分钟' : ''}`;
        
        document.getElementById('stats-month-overtime').textContent = 
            `${Math.floor(totalOvertimeMinutes / 60)}小时${totalOvertimeMinutes % 60 > 0 ? (totalOvertimeMinutes % 60) + '分钟' : ''}`;
        
        document.getElementById('stats-month-avg').textContent = 
            `${dailyAvgHours}小时${dailyAvgMinutesRemainder > 0 ? dailyAvgMinutesRemainder + '分钟' : ''}`;
        
        document.getElementById('stats-month-days').textContent = 
            `${attendanceDaysCount}天`;
        
        // 更新月图表，传递dailyWorkMap参数以确保使用动态计算的数据
        this.calendarFix(monthRecords, dailyWorkMap);
    },
    
    /**
     * 修复版的月图表显示函数
     * @param {Array} records - 月工作记录
     * @param {Map} dailyWorkMap - 按日期存储的工作数据Map，包含动态计算的工时
     */
    calendarFix(records, dailyWorkMap) {
        const chartEl = document.getElementById('stats-month-chart');
        
        // 获取当前日期信息
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        // 获取当前选中的月份
        const { currentYear: viewYear, currentMonth: viewMonth, isCurrentMonth } = this.monthViewState;
        
        // 只有当没有记录，并且不是当前月或当前月但没有处于工作状态时才显示"无数据"
        if (records.length === 0 && (!isCurrentMonth || (isCurrentMonth && TimerService.workStatus !== CONFIG.STATUS.WORKING))) {
            chartEl.innerHTML = '<div class="flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm italic h-full w-full p-6">无数据</div>';
            return;
        }
        
        // 清空图表区域
        chartEl.innerHTML = '';
        
        // 获取当月第一天是星期几（0是周日，6是周六）
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
        
        // 获取当月的总天数 - 修正获取月份天数的方法
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        
        // 添加调试日志
        console.log('月日历数据:', { 
            displayMonth: viewMonth + 1,
            displayYear: viewYear,
            daysInMonth,
            firstDayOfMonth,
            records: records, 
            dailyWorkMap: Array.from(dailyWorkMap.entries())
        });
        
        // 定义月份名称
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // 获取指定日期的工作分钟数
        const getWorkMinutesForDate = (year, month, day) => {
            const date = new Date(year, month, day);
            const dateStr = Utils.formatDate(date);
            const dayData = dailyWorkMap.get(dateStr);
            const workMinutes = dayData ? dayData.workMinutes : 0;
            
            // 添加日期查询调试日志
            if (workMinutes > 0 || day === daysInMonth) {
                console.log('查询日期工时:', {
                    dateStr,
                    year,
                    month: month + 1,
                    day,
                    workMinutes
                });
            }
            
            return workMinutes;
        };
        
        // 检查是否是暗黑模式
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 创建外层容器 - 参考年度趋势的结构
        const outerContainer = document.createElement('div');
        outerContainer.className = 'bg-white dark:bg-gray-800 rounded-lg p-3 w-full';
        
        // 创建内层容器
        const innerContainer = document.createElement('div');
        innerContainer.className = 'flex flex-col space-y-2';
        
        // 创建图例容器 (类似GitHub的贡献热力图图例)
        const legendContainer = document.createElement('div');
        legendContainer.className = 'flex items-center justify-end space-x-1 mb-3';
        
        // 图例文本
        const legendText = document.createElement('span');
        legendText.className = 'text-xs text-gray-500 dark:text-gray-400 mr-1';
        legendText.textContent = '工作时长:';
        legendContainer.appendChild(legendText);
        
        // 图例颜色块
        const legendItems = [
            { color: isDark ? '#2d3748' : '#ebedf0', text: '无记录' },
            { color: isDark ? '#0e4429' : '#ebedf0', text: '低' },
            { color: isDark ? '#006d32' : '#9be9a8', text: '中低' },
            { color: isDark ? '#26a641' : '#40c463', text: '中' },
            { color: isDark ? '#39d353' : '#30a14e', text: '中高' },
            { color: isDark ? '#771c19' : '#ffebe9', text: '加班1h内' },
            { color: isDark ? '#a40e26' : '#ffc1c0', text: '加班1-2h' },
            { color: isDark ? '#c93c37' : '#ff9492', text: '加班2-3h' },
            { color: isDark ? '#e5534b' : '#ff5b56', text: '加班>3h' }
        ];
        
        legendItems.forEach(item => {
            const colorBox = document.createElement('div');
            colorBox.className = 'w-3 h-3 rounded-sm';
            colorBox.style.backgroundColor = item.color;
            colorBox.title = item.text;
            legendContainer.appendChild(colorBox);
        });
        
        innerContainer.appendChild(legendContainer);
        
        // 创建内容容器
        const contentContainer = document.createElement('div');
        contentContainer.className = 'flex flex-col';
        
        // 创建日历容器
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'mt-2 w-full';
        
        // 创建星期几标题行
        const weekdayHeaderContainer = document.createElement('div');
        weekdayHeaderContainer.className = 'grid grid-cols-7 gap-1.5 mb-2';
        
        // 添加星期几的标题（周日至周六）
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach((day, index) => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-xs text-center font-medium';
            // 周末使用紫色，工作日使用灰色
            if (index === 0 || index === 6) {
                dayHeader.classList.add('text-purple-500', 'dark:text-purple-400');
            } else {
                dayHeader.classList.add('text-gray-500', 'dark:text-gray-400');
            }
            dayHeader.textContent = day;
            weekdayHeaderContainer.appendChild(dayHeader);
        });
        
        calendarContainer.appendChild(weekdayHeaderContainer);
        
        // 创建日历网格
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'grid grid-cols-7 gap-1.5 mb-1 min-h-[240px] w-full';
        
        // 计算总行数以设置最小高度
        const numRows = Math.ceil((firstDayOfMonth + daysInMonth) / 7);
        const minRowHeight = 40; // 每行最小高度
        const gridMinHeight = numRows * minRowHeight;
        calendarGrid.style.minHeight = `${gridMinHeight}px`;
        
        // 设置日期单元格大小和样式 - 使用动态高度
        const cellSize = 'min-h-[32px]'; // 使用Tailwind最小高度，允许自动增长
        
        // 填充第一周前面的空格子
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = `${cellSize} bg-gray-100 dark:bg-gray-700 rounded-sm opacity-30`;
            calendarGrid.appendChild(emptyCell);
        }
        
        // 填充日期
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(viewYear, viewMonth, day);
            const dateStr = Utils.formatDate(date);
            const isToday = isCurrentMonth && day === today.getDate();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            // 获取工作分钟数
            const workMinutes = getWorkMinutesForDate(viewYear, viewMonth, day);
            
            // 创建日期单元格
            const dayCell = document.createElement('div');
            dayCell.className = `${cellSize} rounded-sm flex flex-col items-center justify-center group relative transition-all hover:opacity-90 aspect-square`;
            
            // 设置背景色
            dayCell.style.backgroundColor = this.getHeatMapColor(workMinutes);
            
            // 如果是今天，添加特殊边框
            if (isToday) {
                dayCell.classList.add('ring-1', 'ring-secondary');
            } 
            // 如果有工作记录，增加阴影效果
            else if (workMinutes > 0) {
                dayCell.classList.add('shadow-sm');
            }
            
            // 添加日期数字标签
            const dayLabel = document.createElement('div');
            dayLabel.className = 'text-xs font-medium';
            dayLabel.textContent = day;
            
            // 如果是周末或今天，特殊样式
            if (isWeekend) {
                dayLabel.classList.add('text-purple-500', 'dark:text-purple-400');
            } else if (isToday) {
                dayLabel.classList.add('text-secondary');
            } else {
                dayLabel.classList.add('text-gray-700', 'dark:text-gray-300');
            }
            
            dayCell.appendChild(dayLabel);
            
            // 添加工时信息（如果有）
            if (workMinutes > 0) {
                const hoursLabel = document.createElement('div');
                hoursLabel.className = 'text-xs text-gray-600 dark:text-gray-400';
                const hours = Math.floor(workMinutes / 60);
                // 只显示小时部分，保持简洁
                if (hours > 0) {
                    hoursLabel.textContent = `${hours}h`;
                    dayCell.appendChild(hoursLabel);
                }
            }
            
            // 添加详细提示
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-10 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none';
            
            if (workMinutes > 0) {
                const hours = Math.floor(workMinutes / 60);
                const minutes = workMinutes % 60;
                tooltip.textContent = `${dateStr} (${Utils.getDayOfWeek(date)}): ${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
            } else {
                tooltip.textContent = `${dateStr} (${Utils.getDayOfWeek(date)}): 无记录`;
            }
            
            dayCell.appendChild(tooltip);
            calendarGrid.appendChild(dayCell);
        }
        
        // 添加月末后的空格子，使网格完整
        const cellsCount = weekdays.length * Math.ceil((firstDayOfMonth + daysInMonth) / 7);
        const filledCells = firstDayOfMonth + daysInMonth;
        for (let i = 0; i < cellsCount - filledCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = `${cellSize} bg-gray-100 dark:bg-gray-700 rounded-sm opacity-30`;
            calendarGrid.appendChild(emptyCell);
        }
        
        calendarContainer.appendChild(calendarGrid);
        contentContainer.appendChild(calendarContainer);
        innerContainer.appendChild(contentContainer);
        outerContainer.appendChild(innerContainer);
        
        // 将整个容器添加到chartEl
        chartEl.appendChild(outerContainer);
        
        // 添加月度趋势更新时的主题变化响应
        const updateCalendarOnThemeChange = () => {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleThemeChange = () => {
                console.log("主题变化检测：", darkModeMediaQuery.matches ? "暗色模式" : "浅色模式");
                // 重新渲染日历
                this.calendarFix(records, dailyWorkMap);
            };
            
            // 使用更现代的事件监听方式
            try {
                // 尝试使用现代API
                darkModeMediaQuery.addEventListener('change', handleThemeChange);
                
                // 返回清理函数
                return () => {
                    darkModeMediaQuery.removeEventListener('change', handleThemeChange);
                };
            } catch (e) {
                // 兼容旧版浏览器
                console.log("使用兼容方式监听主题变化");
                darkModeMediaQuery.addListener(handleThemeChange);
                
                return () => {
                    darkModeMediaQuery.removeListener(handleThemeChange);
                };
            }
        };
        
        // 初始化主题变化监听
        this.monthChartThemeCleanup = updateCalendarOnThemeChange();
    },
    
    /**
     * 更新年统计数据
     */
    updateYearStats() {
        // 获取当前选择的年份
        const { currentYear, isCurrentYear } = this.yearViewState;
        
        // 添加调试日志，记录年份和Store状态
        console.log('开始更新年统计数据:', { 
            currentYear,
            isCurrentYear,
            allRecords: Store.getAllRecords(),
            yearRecords: isCurrentYear ? Store.getYearRecords() : Store.getYearRecordsByYear(currentYear)
        });
        
        // 更新年份显示
        const yearStr = `${currentYear}年`;
        document.getElementById('stats-year-date').textContent = yearStr;
        
        // 获取指定年份的工作记录
        const yearRecords = isCurrentYear ? Store.getYearRecords() : Store.getYearRecordsByYear(currentYear);
        
        // 使用Map按日期分组，避免重复计算
        const dailyWorkMap = new Map();
        
        // 获取标准工作时长（分钟）
        const standardWorkMinutes = CONFIG.WORK_HOURS.STANDARD_HOURS * 60;
        
        // 计算每天的工作时长，保存到Map中
        yearRecords.forEach(record => {
            // 检查是否是带有records数组的记录格式（来自于getRecordsInRange的新格式）
            if (record.date && Array.isArray(record.records)) {
                // 首先获取该日期的完整工时记录，以便进行动态计算
                const dateObj = new Date(record.date);
                const dateStr = Utils.formatDate(dateObj);
                const todayRecords = Store.getDailyRecord(dateStr);
                
                if (todayRecords) {
                    let dayTotalWorkMinutes = 0;
                    
                    // 计算当天所有记录的总工时
                    if (Array.isArray(todayRecords)) {
                        todayRecords.forEach(dayRecord => {
                            let recordWorkMinutes = 0;
                            
                            // 判断是否有原始记录数据
                            if (dayRecord.rawHours !== undefined && dayRecord.rawMinutes !== undefined && dayRecord.breakMinutes !== undefined) {
                                // 计算原始时间（分钟）
                                const rawTotalMinutes = dayRecord.rawHours * 60 + dayRecord.rawMinutes;
                                
                                // 根据当前设置计算实际工作时间
                                if (CONFIG.EXCLUDE_BREAK_TIME) {
                                    // 有午休设置时，需要扣除午休时间
                                    if (rawTotalMinutes > dayRecord.breakMinutes) {
                                        recordWorkMinutes = rawTotalMinutes - dayRecord.breakMinutes;
                                    } else {
                                        recordWorkMinutes = rawTotalMinutes;
                                    }
                                } else {
                                    // 无午休设置时，直接使用原始时间
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else if (typeof dayRecord.workHours === 'number' && typeof dayRecord.workMinutes === 'number') {
                                // 向后兼容：如果没有原始时间数据，使用保存的工时
                                recordWorkMinutes = dayRecord.workHours * 60 + dayRecord.workMinutes;
                            }
                            
                            // 累加总工时
                            dayTotalWorkMinutes += recordWorkMinutes;
                        });
                    } else {
                        // 单条记录情况
                        let recordWorkMinutes = 0;
                        
                        // 判断是否有原始记录数据
                        if (todayRecords.rawHours !== undefined && todayRecords.rawMinutes !== undefined && todayRecords.breakMinutes !== undefined) {
                            // 计算原始时间（分钟）
                            const rawTotalMinutes = todayRecords.rawHours * 60 + todayRecords.rawMinutes;
                            
                            // 根据当前设置计算实际工作时间
                            if (CONFIG.EXCLUDE_BREAK_TIME) {
                                // 有午休设置时，需要扣除午休时间
                                if (rawTotalMinutes > todayRecords.breakMinutes) {
                                    recordWorkMinutes = rawTotalMinutes - todayRecords.breakMinutes;
                                } else {
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else {
                                // 无午休设置时，直接使用原始时间
                                recordWorkMinutes = rawTotalMinutes;
                            }
                        } else if (typeof todayRecords.workHours === 'number' && typeof todayRecords.workMinutes === 'number') {
                            // 向后兼容：如果没有原始时间数据，使用保存的工时
                            recordWorkMinutes = todayRecords.workHours * 60 + todayRecords.workMinutes;
                        }
                        
                        dayTotalWorkMinutes = recordWorkMinutes;
                    }
                    
                    // 计算加班时间
                    const overtimeMinutes = Math.max(0, dayTotalWorkMinutes - standardWorkMinutes);
                    
                    // 添加到Map
                    dailyWorkMap.set(dateStr, {
                        workMinutes: dayTotalWorkMinutes,
                        overtimeMinutes: overtimeMinutes,
                        date: dateObj
                    });
                }
            } else {
                // 原始格式处理
                const date = record.date;
                const dateObj = new Date(date);
                const dateStr = Utils.formatDate(dateObj);
                const todayRecords = Store.getDailyRecord(dateStr);
                
                if (todayRecords) {
                    let dayTotalWorkMinutes = 0;
                    
                    // 计算当天所有记录的总工时
                    if (Array.isArray(todayRecords)) {
                        todayRecords.forEach(dayRecord => {
                            let recordWorkMinutes = 0;
                            
                            // 判断是否有原始记录数据
                            if (dayRecord.rawHours !== undefined && dayRecord.rawMinutes !== undefined && dayRecord.breakMinutes !== undefined) {
                                // 计算原始时间（分钟）
                                const rawTotalMinutes = dayRecord.rawHours * 60 + dayRecord.rawMinutes;
                                
                                // 根据当前设置计算实际工作时间
                                if (CONFIG.EXCLUDE_BREAK_TIME) {
                                    // 有午休设置时，需要扣除午休时间
                                    if (rawTotalMinutes > dayRecord.breakMinutes) {
                                        recordWorkMinutes = rawTotalMinutes - dayRecord.breakMinutes;
                                    } else {
                                        recordWorkMinutes = rawTotalMinutes;
                                    }
                                } else {
                                    // 无午休设置时，直接使用原始时间
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else if (typeof dayRecord.workHours === 'number' && typeof dayRecord.workMinutes === 'number') {
                                // 向后兼容：如果没有原始时间数据，使用保存的工时
                                recordWorkMinutes = dayRecord.workHours * 60 + dayRecord.workMinutes;
                            }
                            
                            // 累加总工时
                            dayTotalWorkMinutes += recordWorkMinutes;
                        });
                    } else {
                        // 单条记录情况
                        let recordWorkMinutes = 0;
                        
                        // 判断是否有原始记录数据
                        if (todayRecords.rawHours !== undefined && todayRecords.rawMinutes !== undefined && todayRecords.breakMinutes !== undefined) {
                            // 计算原始时间（分钟）
                            const rawTotalMinutes = todayRecords.rawHours * 60 + todayRecords.rawMinutes;
                            
                            // 根据当前设置计算实际工作时间
                            if (CONFIG.EXCLUDE_BREAK_TIME) {
                                // 有午休设置时，需要扣除午休时间
                                if (rawTotalMinutes > todayRecords.breakMinutes) {
                                    recordWorkMinutes = rawTotalMinutes - todayRecords.breakMinutes;
                                } else {
                                    recordWorkMinutes = rawTotalMinutes;
                                }
                            } else {
                                // 无午休设置时，直接使用原始时间
                                recordWorkMinutes = rawTotalMinutes;
                            }
                        } else if (typeof todayRecords.workHours === 'number' && typeof todayRecords.workMinutes === 'number') {
                            // 向后兼容：如果没有原始时间数据，使用保存的工时
                            recordWorkMinutes = todayRecords.workHours * 60 + todayRecords.workMinutes;
                        }
                        
                        dayTotalWorkMinutes = recordWorkMinutes;
                    }
                    
                    // 计算加班时间
                    const overtimeMinutes = Math.max(0, dayTotalWorkMinutes - standardWorkMinutes);
                    
                    // 添加到Map
                    dailyWorkMap.set(dateStr, {
                        workMinutes: dayTotalWorkMinutes,
                        overtimeMinutes: overtimeMinutes,
                        date: dateObj
                    });
                }
            }
        });
        
        // 如果今天正在工作但还没有记录，且正在查看当前年，加上今天的数据
        if (TimerService.workStatus === CONFIG.STATUS.WORKING && isCurrentYear) {
            const today = new Date();
            const todayStr = Utils.formatDate(today);
            
            // 计算当前工作中的工时
            const todayDuration = TimerService.calculateTodayWorkDuration();
            const todayOvertime = TimerService.calculateTodayOvertime();
            
            const todayWorkMinutes = todayDuration.hours * 60 + todayDuration.minutes;
            const todayOvertimeMinutes = todayOvertime.hours * 60 + todayOvertime.minutes;
            
            // 将今天的工时添加/更新到Map中
            dailyWorkMap.set(todayStr, {
                workMinutes: todayWorkMinutes,
                overtimeMinutes: todayOvertimeMinutes
            });
        }
        
        // 计算总工作时长和加班时长
        let totalWorkMinutes = 0;
        let totalOvertimeMinutes = 0;
        
        // 添加调试日志，记录年视图数据计算过程
        console.log('年视图数据计算:', {
            year: yearStr,
            excludeBreakTime: CONFIG.EXCLUDE_BREAK_TIME,
            dailyWorkMap: Array.from(dailyWorkMap.entries()),
        });
        
        // 从Map中汇总所有日期的工时
        dailyWorkMap.forEach(dayData => {
            totalWorkMinutes += dayData.workMinutes;
            totalOvertimeMinutes += dayData.overtimeMinutes;
        });
        
        // 出勤天数就是Map的大小
        const attendanceDaysCount = dailyWorkMap.size;
        
        // 计算日平均工时（基于实际出勤天数）
        const dailyAvgMinutes = attendanceDaysCount > 0 ? Math.round(totalWorkMinutes / attendanceDaysCount) : 0;
        const dailyAvgHours = Math.floor(dailyAvgMinutes / 60);
        const dailyAvgMinutesRemainder = dailyAvgMinutes % 60;
        
        // 更新显示
        document.getElementById('stats-year-duration').textContent = 
            `${Math.floor(totalWorkMinutes / 60)}小时${totalWorkMinutes % 60 > 0 ? (totalWorkMinutes % 60) + '分钟' : ''}`;
        
        document.getElementById('stats-year-overtime').textContent = 
            `${Math.floor(totalOvertimeMinutes / 60)}小时${totalOvertimeMinutes % 60 > 0 ? (totalOvertimeMinutes % 60) + '分钟' : ''}`;
        
        document.getElementById('stats-year-days').textContent = 
            `${attendanceDaysCount}天`;
        
        document.getElementById('stats-year-monthly-avg').textContent = 
            `${dailyAvgHours}小时${dailyAvgMinutesRemainder > 0 ? dailyAvgMinutesRemainder + '分钟' : ''}`;
        
        // 更新年图表
        this.updateYearChart(yearRecords);
    },
    
    /**
     * 更新年图表显示 - GitHub风格贡献热力图，竖向布局
     * @param {Array} records - 年工作记录
     */
    updateYearChart(records) {
        // 如果没有数据，显示空状态
        if (!records || records.length === 0) {
            const chartEl = document.getElementById('stats-year-chart');
            if (chartEl) {
                chartEl.innerHTML = '<div class="flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm italic h-full w-full p-6">无数据</div>';
            }
            return;
        }

        const chartEl = document.getElementById('stats-year-chart');
        if (!chartEl) return;
        
        // 获取当前日期信息
        const today = new Date();
        
        // 创建日期数据映射，记录每天的工作分钟数
        const dailyWorkMap = new Map();
        
        // 将记录转换为每日工作分钟数
        records.forEach(record => {
            // 检查是否是带有records数组的记录格式（来自于getRecordsInRange的新格式）
            if (record.date && Array.isArray(record.records)) {
                // 如果是数组格式，处理每条子记录
                record.records.forEach(subRecord => {
                    const workMinutes = (subRecord.workHours || 0) * 60 + (subRecord.workMinutes || 0);
                    
                    // 如果日期已存在，追加工作时间
                    if (dailyWorkMap.has(record.date)) {
                        const existingData = dailyWorkMap.get(record.date);
                        existingData.workMinutes += workMinutes;
                        dailyWorkMap.set(record.date, existingData);
                    } else {
                        // 否则，创建新数据
                        dailyWorkMap.set(record.date, {
                            workMinutes: workMinutes,
                            date: new Date(record.date)
                        });
                    }
                });
            } else {
                // 原始格式处理
                const date = record.date;
                const workMinutes = (record.workHours || 0) * 60 + (record.workMinutes || 0);
                
                // 如果日期已存在，追加工作时间
                if (dailyWorkMap.has(date)) {
                    const existingData = dailyWorkMap.get(date);
                    existingData.workMinutes += workMinutes;
                    dailyWorkMap.set(date, existingData);
                } else {
                    // 否则，创建新数据
                    dailyWorkMap.set(date, {
                        workMinutes: workMinutes,
                        date: new Date(date)
                    });
                }
            }
        });
        
        // 如果今天正在工作，且查看的是当前年，加入今天的数据
        if (TimerService.workStatus === CONFIG.STATUS.WORKING && this.yearViewState.isCurrentYear) {
            const todayStr = Utils.formatDate(today);
            
            // 计算当前工作中的工时
            const todayDuration = TimerService.calculateTodayWorkDuration();
            const todayWorkMinutes = todayDuration.hours * 60 + todayDuration.minutes;
            
            // 更新今天的工时数据
            if (dailyWorkMap.has(todayStr)) {
                const existingData = dailyWorkMap.get(todayStr);
                existingData.workMinutes = todayWorkMinutes; // 使用最新的实时工作分钟数
                dailyWorkMap.set(todayStr, existingData);
            } else {
                dailyWorkMap.set(todayStr, {
                    workMinutes: todayWorkMinutes,
                    date: new Date()
                });
            }
        }

        // 清空现有内容
        chartEl.innerHTML = '';

        // 创建外层容器
        const outerContainer = document.createElement('div');
        outerContainer.className = 'bg-white dark:bg-gray-800 rounded-lg p-3 w-full';

        // 创建内层容器
        const innerContainer = document.createElement('div');
        innerContainer.className = 'flex flex-col space-y-2';

        // 创建内容容器
        const contentContainer = document.createElement('div');
        contentContainer.className = 'flex flex-col';

        // 创建图例容器 (类似GitHub的贡献热力图图例)
        const legendContainer = document.createElement('div');
        legendContainer.className = 'flex items-center justify-end space-x-1 mb-2';

        // 图例文本
        const legendText = document.createElement('span');
        legendText.className = 'text-xs text-gray-500 dark:text-gray-400 mr-1';
        legendText.textContent = '工作时长:';
        legendContainer.appendChild(legendText);

        // 检查是否是暗黑模式
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        // 图例颜色块
        const legendItems = [
            { color: isDark ? '#2d3748' : '#ebedf0', text: '无记录' },
            { color: isDark ? '#0e4429' : '#ebedf0', text: '低' },
            { color: isDark ? '#006d32' : '#9be9a8', text: '中低' },
            { color: isDark ? '#26a641' : '#40c463', text: '中' },
            { color: isDark ? '#39d353' : '#30a14e', text: '中高' },
            { color: isDark ? '#771c19' : '#ffebe9', text: '加班1h内' },
            { color: isDark ? '#a40e26' : '#ffc1c0', text: '加班1-2h' },
            { color: isDark ? '#c93c37' : '#ff9492', text: '加班2-3h' },
            { color: isDark ? '#e5534b' : '#ff5b56', text: '加班>3h' }
        ];

        legendItems.forEach(item => {
            const colorBox = document.createElement('div');
            colorBox.className = 'w-3 h-3 rounded-sm';
            colorBox.style.backgroundColor = item.color;
            colorBox.title = item.text;
            legendContainer.appendChild(colorBox);
        });

        innerContainer.appendChild(legendContainer);

        // 添加热力图
        const heatmapContainer = document.createElement('div');
        heatmapContainer.className = 'mt-4';

        // 添加星期几标题行
        const weekdayHeaderContainer = document.createElement('div');
        weekdayHeaderContainer.className = 'grid grid-cols-7 gap-1.5 mb-2';
        
        // 添加星期几的标题（周日至周六）
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-xs text-center text-gray-500 dark:text-gray-400 font-medium';
            dayHeader.textContent = day;
            weekdayHeaderContainer.appendChild(dayHeader);
        });
        
        heatmapContainer.appendChild(weekdayHeaderContainer);

        // 创建热力图网格
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid grid-cols-7 gap-1.5 mb-1';
        
        // 获取当前年份的周数
        // 创建一个日期数组，按周组织
        const weeks = [];
        let currentWeek = [];

        // 当前日期和周
        let currentDate = new Date(this.yearViewState.currentYear, 0, 1);
        let currentWeekNum = 1;

        // 循环生成日期直到结束日期（现在是年末，而不是当前日期）
        while (currentDate <= new Date(this.yearViewState.currentYear, 11, 31)) {
            // 获取当前日期的星期（0-6，0表示周日）
            const dayOfWeek = currentDate.getDay();

            // 如果是新的一周开始（周日），且不是第一个日期，则保存前一周并创建新周
            if (dayOfWeek === 0 && currentWeek.length > 0) {
                weeks.push({
                    weekNum: currentWeekNum,
                    dates: currentWeek
                });
                currentWeek = [];
                currentWeekNum++;
            }

            // 将当前日期添加到当前周
            currentWeek.push(new Date(currentDate));

            // 移动到下一天
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 添加最后一周（如果有）
        if (currentWeek.length > 0) {
            weeks.push({
                weekNum: currentWeekNum,
                dates: currentWeek
            });
        }

        // 按周生成网格（每周一行）
        weeks.forEach((week, weekIndex) => {
            // 处理周内的每一天（按周日-周六顺序排列）
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const dateForDay = week.dates.find(d => d.getDay() === dayOfWeek);

                // 创建单元格
                const cell = document.createElement('div');
                cell.className = 'h-6 rounded-sm group relative'; // 增加单元格高度为6px

                if (dateForDay) {
                    // 格式化日期
                    const dateStr = Utils.formatDate(dateForDay);

                    // 获取当前日期的工作分钟数
                    const dayData = dailyWorkMap.get(dateStr);
                    const workMinutes = dayData ? dayData.workMinutes : 0;

                    // 设置单元格颜色
                    cell.style.backgroundColor = this.getHeatMapColor(workMinutes);

                    // 为未来日期添加特殊样式
                    const isInFuture = dateForDay > today;
                    if (isInFuture) {
                        cell.classList.add('opacity-50'); // 半透明表示未来日期
                    }

                    // 如果是今天，添加特殊边框
                    if (Utils.formatDate(today) === dateStr) {
                        cell.classList.add('ring-1', 'ring-secondary');
                    }

                    // 添加工作时间提示
                    const tooltip = document.createElement('div');
                    tooltip.className = 'absolute left-1/2 transform -translate-x-1/2 mb-1 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none bottom-full';

                    const formattedDate = `${dateForDay.getFullYear()}-${dateForDay.getMonth() + 1}-${dateForDay.getDate()}`;
                    if (workMinutes > 0) {
                        const hours = Math.floor(workMinutes / 60);
                        const minutes = workMinutes % 60;
                        tooltip.textContent = `${formattedDate}: ${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
                    } else if (isInFuture) {
                        tooltip.textContent = `${formattedDate}: 未来日期`;
                    } else {
                        tooltip.textContent = `${formattedDate}: 无工作记录`;
                    }

                    cell.appendChild(tooltip);
                } else {
                    // 设置空单元格为透明
                    cell.classList.add('opacity-0');
                }

                gridContainer.appendChild(cell);
            }
        });

        heatmapContainer.appendChild(gridContainer);
        contentContainer.appendChild(heatmapContainer);
        innerContainer.appendChild(contentContainer);
        outerContainer.appendChild(innerContainer);

        // 将整个热力图添加到容器中
        chartEl.appendChild(outerContainer);
    },
    
    /**
     * 清理所有图表相关资源
     */
    cleanupCharts() {
        // 清理月度日历主题变化监听器
        if (this.monthChartThemeCleanup) {
            this.monthChartThemeCleanup();
            this.monthChartThemeCleanup = null;
        }
        
        // 清理周图表主题变化监听器
        if (this.weekChartThemeCleanup) {
            this.weekChartThemeCleanup();
            this.weekChartThemeCleanup = null;
        }
        
        // 清理年图表主题变化监听器
        if (this.yearChartThemeCleanup) {
            this.yearChartThemeCleanup();
            this.yearChartThemeCleanup = null;
        }
        
        // 如果有Chart.js实例，也需要销毁
        if (this.weekChart) {
            this.weekChart.destroy();
            this.weekChart = null;
        }
    },
    
    /**
     * 重置月视图到当前月
     */
    resetMonthViewToCurrentMonth() {
        const today = new Date();
        this.monthViewState = {
            currentMonthOffset: 0,
            currentMonth: today.getMonth(),
            currentYear: today.getFullYear(),
            isCurrentMonth: true
        };
        
        // 更新标题文本
        const titleEl = document.getElementById('stats-month-header-text');
        if (titleEl) {
            titleEl.textContent = '本月数据';
        }
        
        // 更新月度趋势标题
        const overviewTitleEl = document.getElementById('stats-month-overview-title');
        if (overviewTitleEl) {
            overviewTitleEl.textContent = '月度趋势';
        }
        
        // 更新月统计数据
        this.updateMonthStats();
        
        // 更新月导航按钮状态
        this.updateMonthNavigationButtons();
    },
    
    /**
     * 更新月导航按钮状态
     */
    updateMonthNavigationButtons() {
        const monthHeader = document.querySelector('#stats-month .text-lg.font-medium');
        
        // 如果月导航按钮容器不存在，则创建
        let monthNavContainer = document.getElementById('month-nav-container');
        
        if (!monthNavContainer) {
            // 检查标题容器是否存在
            if (!monthHeader) return;
            
            // 创建一个水平flex容器，包含标题和导航按钮
            const headerContainer = document.createElement('div');
            headerContainer.className = 'flex items-center justify-between mb-2';
            headerContainer.id = 'stats-month-header';
            
            // 移动原标题到新容器
            const titleEl = document.createElement('div');
            titleEl.className = 'text-lg font-medium';
            titleEl.id = 'stats-month-header-text';
            titleEl.textContent = this.monthViewState?.isCurrentMonth ? '本月数据' : '历史数据';
            headerContainer.appendChild(titleEl);
            
            // 创建导航按钮容器
            monthNavContainer = document.createElement('div');
            monthNavContainer.id = 'month-nav-container';
            monthNavContainer.className = 'flex items-center space-x-2';
            
            // 创建上一月按钮
            const prevMonthBtn = document.createElement('button');
            prevMonthBtn.id = 'prev-month-btn';
            prevMonthBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            prevMonthBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
            prevMonthBtn.title = '查看上一月';
            prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
            monthNavContainer.appendChild(prevMonthBtn);
            
            // 创建回到当前月按钮
            const currentMonthBtn = document.createElement('button');
            currentMonthBtn.id = 'current-month-btn';
            currentMonthBtn.className = 'hidden p-1 px-2 text-xs rounded bg-primary text-white hover:bg-indigo-600 transition-colors';
            currentMonthBtn.textContent = '回到本月';
            currentMonthBtn.addEventListener('click', () => {
                this.resetMonthViewToCurrentMonth();
                this.updateMonthStats();
            });
            monthNavContainer.appendChild(currentMonthBtn);
            
            // 创建下一月按钮
            const nextMonthBtn = document.createElement('button');
            nextMonthBtn.id = 'next-month-btn';
            nextMonthBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            nextMonthBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
            nextMonthBtn.title = '查看下一月';
            nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
            monthNavContainer.appendChild(nextMonthBtn);
            
            headerContainer.appendChild(monthNavContainer);
            
            // 将新的标题容器插入到原标题位置
            monthHeader.parentNode.replaceChild(headerContainer, monthHeader);
        }
        
        // 更新导航按钮状态
        const currentMonthBtn = document.getElementById('current-month-btn');
        const nextMonthBtn = document.getElementById('next-month-btn');
        
        // 如果不是当前月，显示"回到本月"按钮
        if (currentMonthBtn) {
            if (this.monthViewState.isCurrentMonth) {
                currentMonthBtn.classList.add('hidden');
            } else {
                currentMonthBtn.classList.remove('hidden');
            }
        }
        
        // 如果是未来月，禁用"下一月"按钮
        if (nextMonthBtn) {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            
            const viewYear = this.monthViewState.currentYear;
            const viewMonth = this.monthViewState.currentMonth;
            
            if (viewYear > currentYear || (viewYear === currentYear && viewMonth >= currentMonth)) {
                nextMonthBtn.classList.add('opacity-50', 'cursor-not-allowed');
                nextMonthBtn.disabled = true;
            } else {
                nextMonthBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                nextMonthBtn.disabled = false;
            }
        }
    },
    
    /**
     * 导航到上一月或下一月
     * @param {number} direction - 导航方向，-1为上一月，1为下一月
     */
    navigateMonth(direction) {
        // 获取当前月视图状态
        let { currentYear, currentMonth } = this.monthViewState;
        
        // 计算新的月份
        currentMonth += direction;
        
        // 处理跨年情况
        if (currentMonth < 0) {
            currentMonth = 11;  // 12月
            currentYear -= 1;
        } else if (currentMonth > 11) {
            currentMonth = 0;   // 1月
            currentYear += 1;
        }
        
        // 获取今天的日期
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        
        // 如果是未来月，不允许导航
        if (direction > 0 && (currentYear > todayYear || (currentYear === todayYear && currentMonth > todayMonth))) {
            return;
        }
        
        // 计算月份偏移量
        const currentMonthOffset = (currentYear - todayYear) * 12 + (currentMonth - todayMonth);
        
        // 更新状态
        this.monthViewState = {
            currentMonthOffset,
            currentMonth,
            currentYear,
            isCurrentMonth: currentMonthOffset === 0
        };
        
        // 更新标题文本
        const titleEl = document.getElementById('stats-month-header-text');
        if (titleEl) {
            titleEl.textContent = this.monthViewState.isCurrentMonth ? '本月数据' : '历史数据';
        }
        
        // 更新月度趋势标题
        const overviewTitleEl = document.getElementById('stats-month-overview-title');
        if (overviewTitleEl) {
            overviewTitleEl.textContent = this.monthViewState.isCurrentMonth ? '月度趋势' : '历史趋势';
        }
        
        // 更新月统计数据
        this.updateMonthStats();
        
        // 更新导航按钮状态
        this.updateMonthNavigationButtons();
    },
    
    /**
     * 重置年视图到当前年
     */
    resetYearViewToCurrentYear() {
        const today = new Date();
        this.yearViewState = {
            currentYearOffset: 0,
            currentYear: today.getFullYear(),
            isCurrentYear: true
        };
        
        // 更新标题文本
        const titleEl = document.getElementById('stats-year-header-text');
        if (titleEl) {
            titleEl.textContent = '年度数据';
        }
        
        // 更新年度趋势标题
        const overviewTitleEl = document.getElementById('stats-year-overview-title');
        if (overviewTitleEl) {
            overviewTitleEl.textContent = '年度趋势';
        }
        
        // 更新年统计数据
        this.updateYearStats();
        
        // 更新年导航按钮状态
        this.updateYearNavigationButtons();
    },
    
    /**
     * 更新年导航按钮状态
     */
    updateYearNavigationButtons() {
        const yearHeader = document.getElementById('stats-year-header');
        
        // 如果年导航按钮容器不存在，则创建
        let yearNavContainer = document.getElementById('year-nav-container');
        
        if (!yearNavContainer) {
            // 检查标题容器是否存在
            if (!yearHeader) return;
            
            // 创建一个水平flex容器，包含标题和导航按钮
            const headerContainer = document.createElement('div');
            headerContainer.className = 'flex items-center justify-between mb-2';
            headerContainer.id = 'stats-year-header';
            
            // 移动原标题到新容器
            const titleEl = document.createElement('div');
            titleEl.className = 'text-lg font-medium';
            titleEl.id = 'stats-year-header-text';
            titleEl.textContent = this.yearViewState?.isCurrentYear ? '年度数据' : '历史年度';
            headerContainer.appendChild(titleEl);
            
            // 创建导航按钮容器
            yearNavContainer = document.createElement('div');
            yearNavContainer.id = 'year-nav-container';
            yearNavContainer.className = 'flex items-center space-x-2';
            
            // 创建上一年按钮
            const prevYearBtn = document.createElement('button');
            prevYearBtn.id = 'prev-year-btn';
            prevYearBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            prevYearBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
            prevYearBtn.title = '查看上一年';
            prevYearBtn.addEventListener('click', () => this.navigateYear(-1));
            yearNavContainer.appendChild(prevYearBtn);
            
            // 创建回到当前年按钮
            const currentYearBtn = document.createElement('button');
            currentYearBtn.id = 'current-year-btn';
            currentYearBtn.className = 'hidden p-1 px-2 text-xs rounded bg-primary text-white hover:bg-indigo-600 transition-colors';
            currentYearBtn.textContent = '回到本年';
            currentYearBtn.addEventListener('click', () => {
                this.resetYearViewToCurrentYear();
                this.updateYearStats();
            });
            yearNavContainer.appendChild(currentYearBtn);
            
            // 创建下一年按钮
            const nextYearBtn = document.createElement('button');
            nextYearBtn.id = 'next-year-btn';
            nextYearBtn.className = 'p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors';
            nextYearBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
            nextYearBtn.title = '查看下一年';
            nextYearBtn.addEventListener('click', () => this.navigateYear(1));
            yearNavContainer.appendChild(nextYearBtn);
            
            headerContainer.appendChild(yearNavContainer);
            
            // 将新的标题容器插入到原标题位置
            yearHeader.parentNode.replaceChild(headerContainer, yearHeader);
        }
        
        // 更新导航按钮状态
        const currentYearBtn = document.getElementById('current-year-btn');
        const nextYearBtn = document.getElementById('next-year-btn');
        
        // 如果不是当前年，显示"回到本年"按钮
        if (currentYearBtn) {
            if (this.yearViewState.isCurrentYear) {
                currentYearBtn.classList.add('hidden');
            } else {
                currentYearBtn.classList.remove('hidden');
            }
        }
        
        // 如果是未来年，禁用"下一年"按钮
        if (nextYearBtn) {
            const today = new Date();
            const currentYear = today.getFullYear();
            
            const viewYear = this.yearViewState.currentYear;
            
            if (viewYear >= currentYear) {
                nextYearBtn.classList.add('opacity-50', 'cursor-not-allowed');
                nextYearBtn.disabled = true;
            } else {
                nextYearBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                nextYearBtn.disabled = false;
            }
        }
    },
    
    /**
     * 导航到上一年或下一年
     * @param {number} direction - 导航方向，-1为上一年，1为下一年
     */
    navigateYear(direction) {
        // 获取当前年份
        let { currentYear } = this.yearViewState;
        
        // 计算新的年份
        currentYear += direction;
        
        // 获取今天的日期
        const today = new Date();
        const todayYear = today.getFullYear();
        
        // 如果是未来年，不允许导航
        if (direction > 0 && currentYear > todayYear) {
            return;
        }
        
        // 更新状态
        this.yearViewState = {
            currentYearOffset: currentYear - todayYear,
            currentYear,
            isCurrentYear: currentYear === todayYear
        };
        
        // 更新标题文本
        const titleEl = document.getElementById('stats-year-header-text');
        if (titleEl) {
            titleEl.textContent = this.yearViewState.isCurrentYear ? '年度数据' : '历史年度';
        }
        
        // 更新年度趋势标题
        const overviewTitleEl = document.getElementById('stats-year-overview-title');
        if (overviewTitleEl) {
            overviewTitleEl.textContent = this.yearViewState.isCurrentYear ? '年度趋势' : '历史趋势';
        }
        
        // 更新年统计数据
        this.updateYearStats();
        
        // 更新导航按钮状态
        this.updateYearNavigationButtons();
    },
    
    /**
     * 获取热力图颜色 - 与月度日历保持一致的颜色方案
     * @param {Number} workMinutes - 工作分钟数
     * @param {Number} maxMinutes - 最大工作分钟数（未使用）
     * @returns {String} - 代表热力图颜色的CSS颜色值
     */
    getHeatMapColor(minutes) {
        // 检查是否是暗色模式
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 根据工作分钟数返回不同深度的颜色
        if (!minutes || minutes <= 0) {
            return isDarkMode ? '#2d3748' : '#ebedf0'; // 无工作时间用浅灰色
        }
        
        // 标准工时（单位：分钟）
        const standardHours = CONFIG.WORK_HOURS.STANDARD_HOURS;
        const standardMinutes = standardHours * 60;
        
        // 标准工时内，返回由暗到亮的绿色（GitHub风格）
        if (minutes <= standardMinutes) {
            // 按照标准工时的比例确定绿色深度
            const percentage = minutes / standardMinutes;
            if (percentage <= 0.25) {
                return isDarkMode ? '#0e4429' : '#ebedf0'; // 最暗的绿色 - 25%以下
            } else if (percentage <= 0.5) {
                return isDarkMode ? '#006d32' : '#9be9a8'; // 较暗绿色 - 50%以下
            } else if (percentage <= 0.75) {
                return isDarkMode ? '#26a641' : '#40c463'; // 中等绿色 - 75%以下
            } else {
                return isDarkMode ? '#39d353' : '#30a14e'; // 较亮绿色 - 75%-100%
            }
        }
        
        // 超过标准工时（加班），返回由暗到亮的红色系列
        const overtimeMinutes = minutes - standardMinutes;
        if (overtimeMinutes <= 60) { // 加班不到1小时
            return isDarkMode ? '#771c19' : '#ffebe9'; // 最暗红色
        } else if (overtimeMinutes <= 120) { // 加班1-2小时
            return isDarkMode ? '#a40e26' : '#ffc1c0'; // 较暗红色
        } else if (overtimeMinutes <= 180) { // 加班2-3小时
            return isDarkMode ? '#c93c37' : '#ff9492'; // 中等红色
        } else { // 加班超过3小时
            return isDarkMode ? '#e5534b' : '#ff5b56'; // 亮红色
        }
    }
}; 