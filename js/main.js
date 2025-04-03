/**
 * 主入口文件
 * 负责初始化和启动应用
 */

// 当文档完全加载后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    initApp();
});

/**
 * 诊断本地存储问题
 */
function diagnosePersistenceIssues() {
    console.log('=====================================');
    console.log('开始诊断本地存储问题...');
    
    // 直接测试localStorage功能
    try {
        console.log('测试1: 直接使用localStorage');
        
        // 清除测试键
        localStorage.removeItem('test_key');
        
        // 设置测试值
        localStorage.setItem('test_key', 'test_value');
        const testResult = localStorage.getItem('test_key');
        console.log('设置test_key=test_value, 获取结果:', testResult);
        
        if (testResult !== 'test_value') {
            console.error('localStorage基础功能异常!');
        } else {
            console.log('localStorage基础功能正常');
        }
    } catch (e) {
        console.error('localStorage基础测试失败:', e);
    }
    
    // 测试工作状态存储
    try {
        console.log('测试2: 工作状态存储测试');
        
        // 保存当前状态以便恢复
        const originalStatus = localStorage.getItem(CONFIG.STORAGE_KEYS.WORK_STATUS);
        console.log('当前存储的工作状态:', originalStatus);
        
        // 直接测试completed状态
        console.log('直接设置completed状态...');
        localStorage.setItem(CONFIG.STORAGE_KEYS.WORK_STATUS, JSON.stringify(CONFIG.STATUS.COMPLETED));
        
        // 读取并验证
        const rawSaved = localStorage.getItem(CONFIG.STORAGE_KEYS.WORK_STATUS);
        console.log('原始存储值:', rawSaved);
        
        try {
            const parsed = JSON.parse(rawSaved);
            console.log('解析后的值:', parsed);
            
            if (parsed !== CONFIG.STATUS.COMPLETED) {
                console.error('工作状态存储异常: 值不匹配');
            } else {
                console.log('工作状态存储测试成功');
            }
        } catch (parseError) {
            console.error('工作状态解析失败:', parseError);
        }
        
        // 恢复原状态
        if (originalStatus !== null) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.WORK_STATUS, originalStatus);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.WORK_STATUS);
        }
    } catch (e) {
        console.error('工作状态存储测试失败:', e);
    }
    
    console.log('诊断完成');
    console.log('=====================================');
}

/**
 * 检查应用版本并处理数据迁移
 */
function handleVersionUpdate() {
    console.log('检查应用版本更新...');
    
    // 获取当前应用版本（应该在CONFIG中定义）
    const currentVersion = CONFIG.APP_VERSION || '1.0.0';
    
    // 从本地存储获取上次运行的版本
    const lastVersion = localStorage.getItem('app_version') || '0.0.0';
    
    console.log(`上次版本: ${lastVersion}, 当前版本: ${currentVersion}`);
    
    // 如果版本不同，可能需要执行数据迁移
    if (lastVersion !== currentVersion) {
        console.log('检测到版本更新，执行数据迁移...');
        
        // 在这里可以根据不同的版本执行不同的迁移策略
        // 例如，迁移数据格式，添加新的默认设置等
        
        try {
            // 假设我们要从 v0.x 迁移到 v1.x
            if (lastVersion.startsWith('0.') && currentVersion.startsWith('1.')) {
                console.log('从v0.x迁移到v1.x');
                // 执行特定的迁移逻辑...
            }
            
            // 保存新的版本号
            localStorage.setItem('app_version', currentVersion);
            console.log('数据迁移完成，版本已更新');
        } catch (e) {
            console.error('数据迁移过程中出错:', e);
            // 处理迁移错误，例如可能需要回滚或提供手动修复选项
        }
    } else {
        console.log('版本未变更，无需数据迁移');
    }
}

/**
 * 初始化应用
 */
function initApp() {
    console.log('打工人工时记录应用启动中...');
    
    // 禁用浏览器缓存
    disableBrowserCache();
    
    // 初始化各个控制器和服务
    try {
        // 检查是否需要重新加载配置
        if (window.needsConfigReload) {
            console.log('检测到需要重新加载配置');
            reloadConfig();
        }
        
        // 诊断本地存储问题
        diagnosePersistenceIssues();
        
        // 检查版本并进行必要的数据迁移
        handleVersionUpdate();
        
        // 最直接的修复：检查本地存储状态一致性
        fixStatusConsistency();
        
        // 初始化用户偏好设置
        UserPreferences.init();
        
        // 检查是否为新的一天，重置状态
        checkAndResetDay();
        
        // 初始化计时器服务
        TimerService.init();
        
        // 初始化UI控制器
        UIController.init();
        
        // 初始化统计控制器
        StatsController.init();
        
        // 初始化设置控制器
        SettingsController.init();
        
        // 初始化滑动导航
        initSwipeNavigation();
        
        // 应用主题和字体大小设置
        UIController.applyTheme();
        UIController.applyFontSize();
        
        // 处理iOS和Android的独立运行模式和启动动作
        handleIOSAppMode();
        
        console.log('应用初始化完成');
    } catch (e) {
        console.error('应用初始化失败:', e);
        alert('应用初始化出现问题: ' + e.message);
    }
    
    // 更新最后访问时间
    localStorage.setItem('lastVisitTime', Date.now().toString());
    
    // DEBUG
    window.DEBUG = {
        showAllRecords: () => console.table(Store.getAllRecords()),
        getTodayRecords: () => console.log(Store.getDailyRecord(Utils.formatDate(new Date()))),
    };
}

/**
 * 重新加载配置
 * 在确保 Store 已加载后调用
 */
function reloadConfig() {
    if (typeof Store !== 'undefined' && Store && Store.loadConfig) {
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
            
            // 更新午休时间配置
            if (typeof savedConfig.breakDuration === 'number') {
                CONFIG.BREAK_DURATION = savedConfig.breakDuration;
            }
            
            if (savedConfig.breakStartTime) {
                CONFIG.BREAK_START_TIME = savedConfig.breakStartTime;
            }
            
            if (savedConfig.breakEndTime) {
                CONFIG.BREAK_END_TIME = savedConfig.breakEndTime;
            }
            
            // 更新加班阈值
            CONFIG.WORKING_OVERTIME_THRESHOLD_1 = CONFIG.STANDARD_WORK_HOURS * 60;
            CONFIG.WORKING_OVERTIME_THRESHOLD_2 = (CONFIG.STANDARD_WORK_HOURS + 1) * 60;
            
            console.log('已重新加载配置', savedConfig);
        }
        
        // 清除标记
        window.needsConfigReload = false;
    }
}

// 确保 reloadConfig 在全局范围内可访问
window.reloadConfig = reloadConfig;

/**
 * 修复状态一致性问题
 * 这个函数会检查工作结束时间和工作状态之间的一致性
 * 如果有结束时间但状态不是"已完成"，则修正状态
 */
function fixStatusConsistency() {
    console.log('检查工作状态一致性...');
    
    // 直接从localStorage读取，避免任何序列化/反序列化问题
    const endTimeRaw = localStorage.getItem(CONFIG.STORAGE_KEYS.WORK_END_TIME);
    const statusRaw = localStorage.getItem(CONFIG.STORAGE_KEYS.WORK_STATUS);
    
    console.log('原始数据 - 结束时间:', endTimeRaw, '状态:', statusRaw);
    
    try {
        const hasEndTime = endTimeRaw && endTimeRaw !== 'null';
        const parsedStatus = statusRaw ? JSON.parse(statusRaw) : null;
        
        console.log('解析后 - 有结束时间:', hasEndTime, '状态:', parsedStatus);
        
        // 如果有结束时间但状态不是"已完成"
        if (hasEndTime && parsedStatus !== CONFIG.STATUS.COMPLETED) {
            console.log('发现状态不一致！有结束时间但状态不是"已完成"，正在修复...');
            
            // 直接设置状态为"已完成"
            localStorage.setItem(CONFIG.STORAGE_KEYS.WORK_STATUS, JSON.stringify(CONFIG.STATUS.COMPLETED));
            
            // 验证修复
            const fixedStatus = localStorage.getItem(CONFIG.STORAGE_KEYS.WORK_STATUS);
            console.log('修复后的状态:', fixedStatus);
        } else {
            console.log('工作状态一致性检查通过');
        }
    } catch (error) {
        console.error('状态一致性检查出错:', error);
    }
}

/**
 * 检查是否需要重置当天状态
 */
function checkAndResetDay() {
    // 获取上次访问时间
    const lastVisitTimeStr = localStorage.getItem('lastVisitTime');
    
    if (lastVisitTimeStr) {
        const lastVisitTime = new Date(parseInt(lastVisitTimeStr));
        const today = new Date();
        
        // 如果上次访问不是今天，并且工作状态仍是"工作中"，则重置状态
        if (!Utils.isSameDay(lastVisitTime, today) && 
            Store.getWorkStatus() === CONFIG.STATUS.WORKING) {
            
            console.log('检测到新的一天，重置工作状态');
            
            // 获取未完成的工作记录
            const workStartTime = Store.getWorkStartTime();
            if (workStartTime) {
                // 将未完成的工作记录以上次访问时间作为结束时间保存
                const dateStr = Utils.formatDate(workStartTime);
                const diff = Utils.calculateTimeDifference(workStartTime, lastVisitTime);
                
                // 计算加班时间
                let overtimeHours = 0;
                let overtimeMinutes = 0;
                
                if (diff.hours > CONFIG.WORK_HOURS.STANDARD_HOURS) {
                    overtimeHours = diff.hours - CONFIG.WORK_HOURS.STANDARD_HOURS;
                    overtimeMinutes = diff.minutes;
                } else if (diff.hours === CONFIG.WORK_HOURS.STANDARD_HOURS && diff.minutes > 0) {
                    overtimeHours = 0;
                    overtimeMinutes = diff.minutes;
                }
                
                // 创建工作记录
                const record = {
                    startTime: workStartTime.getTime(),
                    endTime: lastVisitTime.getTime(),
                    workHours: diff.hours,
                    workMinutes: diff.minutes,
                    overtimeHours,
                    overtimeMinutes,
                    status: CONFIG.STATUS.COMPLETED,
                    autoCompleted: true // 标记为自动完成
                };
                
                // 保存到本地存储
                Store.saveDailyRecord(dateStr, record);
            }
            
            // 重置当天状态
            TimerService.resetDailyStatus();
        }
    }
    
    // 更新最后访问时间
    localStorage.setItem('lastVisitTime', Date.now().toString());
}

// 初始化滑动导航功能
function initSwipeNavigation() {
    const appElement = document.getElementById('app');
    let touchStartX = 0;
    let touchEndX = 0;

    // 滑动的灵敏度阈值 (像素)
    const SWIPE_THRESHOLD = 50;
    
    // 记录滑动开始位置
    appElement.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    // 记录滑动结束位置并处理滑动
    appElement.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    // 处理滑动手势
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        
        // 如果滑动距离超过阈值
        if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
            // 获取当前激活的tab
            const activeTabBtn = document.querySelector('.tab-btn.active');
            const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
            const currentIndex = tabBtns.indexOf(activeTabBtn);
            
            // 如果向左滑动，切换到右边的tab (swipeDistance < 0)
            // 如果向右滑动，切换到左边的tab (swipeDistance > 0)
            if (swipeDistance < 0 && currentIndex < tabBtns.length - 1) {
                // 左滑 - 下一个tab
                tabBtns[currentIndex + 1].click();
            } else if (swipeDistance > 0 && currentIndex > 0) {
                // 右滑 - 上一个tab
                tabBtns[currentIndex - 1].click();
            }
        }
    }
    
    // 添加视觉反馈
    let animationFrame;
    appElement.addEventListener('touchmove', function(e) {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        animationFrame = requestAnimationFrame(() => {
            const currentX = e.changedTouches[0].screenX;
            const diff = currentX - touchStartX;
            
            // 仅在差距足够大时添加视觉反馈
            if (Math.abs(diff) > 20) {
                const activeContent = document.querySelector('.tab-content:not(.hidden)');
                if (activeContent) {
                    // 添加轻微的移动效果，但限制最大移动距离
                    const translateX = Math.min(Math.max(diff * 0.1, -10), 10);
                    activeContent.style.transform = `translateX(${translateX}px)`;
                    activeContent.style.transition = 'none';
                }
            }
        });
    }, { passive: true });
    
    // 重置视觉效果
    appElement.addEventListener('touchend', function() {
        const activeContent = document.querySelector('.tab-content:not(.hidden)');
        if (activeContent) {
            activeContent.style.transform = 'translateX(0)';
            activeContent.style.transition = 'transform 0.3s ease';
        }
    }, { passive: true });
}

/**
 * 处理iOS和Android的独立运行模式和启动动作
 */
function handleIOSAppMode() {
    // 检测是否是以独立应用模式运行
    const isInStandaloneMode = (window.navigator.standalone === true) || 
                              (window.matchMedia('(display-mode: standalone)').matches);
    
    // 检测设备类型
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // 如果是以独立应用模式运行，添加原生应用风格的行为
    if (isInStandaloneMode) {
        console.log('应用以独立模式运行');
        
        // 添加导航滑动手势支持
        enableNativeAppGestures();
        
        // 处理启动动作
        handleLaunchAction();
        
        // 添加特定平台的类
        if (isIOS) {
            document.body.classList.add('ios-standalone');
        } else if (isAndroid) {
            document.body.classList.add('android-standalone');
        }
    } else {
        // 不是独立模式，根据平台显示添加到主屏幕的提示
        const notSeenInstallPrompt = localStorage.getItem('seen_install_prompt') !== 'true';
        
        if (notSeenInstallPrompt) {
            setTimeout(() => {
                if (isIOS) {
                    showIOSInstallPrompt();
                } else if (isAndroid) {
                    setupAndroidInstallPrompt();
                }
                localStorage.setItem('seen_install_prompt', 'true');
            }, 3000);
        }
    }
}

/**
 * 启用类似原生应用的导航手势
 */
function enableNativeAppGestures() {
    // 添加右滑返回手势，在统计页面返回到打卡页面
    const appElement = document.getElementById('app');
    
    // 在独立模式下，调整样式和行为使其更像原生应用
    document.body.classList.add('app-standalone');
}

/**
 * 显示iOS添加到主屏幕的提示
 */
function showIOSInstallPrompt() {
    // 创建提示元素
    const promptEl = document.createElement('div');
    promptEl.className = 'add-to-home-prompt';
    promptEl.innerHTML = `
        <div class="prompt-content">
            <i class="ri-add-box-line prompt-icon"></i>
            <div class="prompt-text">
                <strong>添加到主屏幕</strong>
                <p>点击 <i class="ri-share-forward-line"></i> 然后选择"添加到主屏幕"</p>
            </div>
            <button class="prompt-close-btn"><i class="ri-close-line"></i></button>
        </div>
        <div class="prompt-arrow"></div>
    `;
    
    addPromptStyles();
    document.body.appendChild(promptEl);
    setupPromptEvents(promptEl);
}

/**
 * 设置Android安装提示
 */
function setupAndroidInstallPrompt() {
    // 监听beforeinstallprompt事件
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // 阻止Chrome 67及更早版本自动显示安装提示
        e.preventDefault();
        // 保存事件以便稍后触发
        deferredPrompt = e;
        
        // 显示自定义安装按钮
        showAndroidInstallPrompt(deferredPrompt);
    });
}

/**
 * 显示Android添加到主屏幕的提示
 */
function showAndroidInstallPrompt(deferredPrompt) {
    // 如果没有安装提示事件，返回
    if (!deferredPrompt) return;
    
    // 创建提示元素
    const promptEl = document.createElement('div');
    promptEl.className = 'add-to-home-prompt';
    promptEl.innerHTML = `
        <div class="prompt-content">
            <i class="ri-android-line prompt-icon"></i>
            <div class="prompt-text">
                <strong>安装应用</strong>
                <p>添加到主屏幕，获得更好体验</p>
            </div>
            <button class="prompt-install-btn">安装</button>
            <button class="prompt-close-btn"><i class="ri-close-line"></i></button>
        </div>
    `;
    
    addPromptStyles();
    document.body.appendChild(promptEl);
    
    // 安装按钮事件
    const installBtn = promptEl.querySelector('.prompt-install-btn');
    installBtn.addEventListener('click', async () => {
        // 隐藏我们的提示UI
        promptEl.style.display = 'none';
        
        // 显示安装提示
        deferredPrompt.prompt();
        
        // 等待用户响应
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`用户安装选择: ${outcome}`);
        
        // 清除引用
        deferredPrompt = null;
    });
    
    setupPromptEvents(promptEl);
}

/**
 * 添加提示样式
 */
function addPromptStyles() {
    // 检查是否已经添加了样式
    if (document.getElementById('prompt-styles')) return;
    
    // 样式
    const style = document.createElement('style');
    style.id = 'prompt-styles';
    style.textContent = `
        .add-to-home-prompt {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 320px;
            background: rgba(0,0,0,0.8);
            border-radius: 10px;
            color: white;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slide-up 0.3s ease-out forwards;
        }
        .prompt-content {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
        }
        .prompt-icon {
            font-size: 24px;
            margin-right: 10px;
            color: #6366F1;
        }
        .prompt-text {
            flex: 1;
            font-size: 14px;
            min-width: 150px;
        }
        .prompt-text p {
            margin: 2px 0 0 0;
            opacity: 0.8;
            font-size: 12px;
        }
        .prompt-close-btn {
            background: transparent;
            border: none;
            color: white;
            padding: 5px;
            font-size: 18px;
            cursor: pointer;
        }
        .prompt-install-btn {
            background: #6366F1;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 5px 15px;
            font-size: 14px;
            cursor: pointer;
            margin-right: 10px;
        }
        .prompt-arrow {
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid rgba(0,0,0,0.8);
        }
        @keyframes slide-up {
            from { transform: translate(-50%, 100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
    `;
    
    // 添加到页面
    document.head.appendChild(style);
}

/**
 * 设置提示交互事件
 */
function setupPromptEvents(promptEl) {
    // 关闭按钮事件
    const closeBtn = promptEl.querySelector('.prompt-close-btn');
    closeBtn.addEventListener('click', () => {
        promptEl.style.display = 'none';
    });
    
    // 自动关闭
    setTimeout(() => {
        if (promptEl.parentNode === document.body) {
            promptEl.style.opacity = '0';
            promptEl.style.transform = 'translate(-50%, 100%)';
            promptEl.style.transition = 'all 0.3s ease-out';
            setTimeout(() => {
                if (promptEl.parentNode === document.body) {
                    document.body.removeChild(promptEl);
                }
            }, 300);
        }
    }, 15000);
}

/**
 * 处理通过主屏幕快捷方式启动的情景
 */
function handleLaunchAction() {
    // 检查URL是否包含特定的启动动作
    const url = new URL(window.location.href);
    const hash = url.hash.substring(1); // 移除#字符
    
    // 根据启动动作设置相应的tab
    if (hash === 'clock-in') {
        // 切换到打卡页面并激活上班按钮
        document.getElementById('tab-record').click();
        // 如果当前状态为IDLE，自动触发上班打卡
        if (TimerService.workStatus === CONFIG.STATUS.IDLE) {
            setTimeout(() => {
                const clockInBtn = document.getElementById('clock-in-btn');
                if (clockInBtn && !clockInBtn.disabled) {
                    clockInBtn.click();
                }
            }, 500);
        }
    } else if (hash === 'stats') {
        // 切换到报表页面
        document.getElementById('tab-stats').click();
    }
}

/**
 * 禁用浏览器缓存
 */
function disableBrowserCache() {
    // 1. 为所有脚本和样式表添加随机参数
    console.log('禁用浏览器缓存...');
    
    // 添加时间戳到所有已加载的脚本
    document.querySelectorAll('script[src]').forEach(script => {
        const currentSrc = script.getAttribute('src');
        if (currentSrc && !currentSrc.includes('?')) {
            script.setAttribute('src', `${currentSrc}?v=${Date.now()}`);
        }
    });
    
    // 添加时间戳到所有已加载的样式表
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const currentHref = link.getAttribute('href');
        if (currentHref && !currentHref.includes('?')) {
            link.setAttribute('href', `${currentHref}?v=${Date.now()}`);
        }
    });
    
    // 2. 设置HTTP头以防止缓存
    if (window.fetch) {
        // 为fetch请求设置默认的请求头，防止缓存
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // 确保options.headers存在
            options.headers = options.headers || {};
            
            // 添加防止缓存的请求头
            options.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            options.headers['Pragma'] = 'no-cache';
            options.headers['Expires'] = '0';
            
            // 添加随机参数到URL
            const urlWithCache = url.includes('?') 
                ? `${url}&nocache=${Date.now()}` 
                : `${url}?nocache=${Date.now()}`;
            
            return originalFetch(urlWithCache, options);
        };
    }
    
    // 3. 重载页面时强制从服务器获取新内容
    window.addEventListener('beforeunload', () => {
        // 设置一个时间戳，当页面重载时使用
        sessionStorage.setItem('reloadTimestamp', Date.now().toString());
    });
    
    // 4. 检查是否是页面重载，如果是，检查引用的资源是否需要强制刷新
    const reloadTimestamp = sessionStorage.getItem('reloadTimestamp');
    if (reloadTimestamp) {
        console.log('检测到页面重载，正在更新资源引用...');
        
        // 清除重载时间戳
        sessionStorage.removeItem('reloadTimestamp');
        
        // 如果是PWA模式，可能需要检查service worker和缓存
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.update();
                }
            });
        }
    }
    
    console.log('浏览器缓存禁用完成');
} 