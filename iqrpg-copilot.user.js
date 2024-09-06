// ==UserScript==
// @name         iqrpg-copilot
// @version      0.0.8
// @description  auto loop/boss
// @author       ABang
// @match        https://www.iqrpg.com/game.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iqrpg.com
// @updateURL    https://raw.githubusercontent.com/abangZ/iqrpg-scripts/main/iqrpg-copilot.user.js
// @downloadURL  https://raw.githubusercontent.com/abangZ/iqrpg-scripts/main/iqrpg-copilot.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * 使用本脚本可能违反游戏服务条款，导致账号封禁或其他后果，作者不承担任何责任。请用户自行评估风险。
 */

console.log('### iqrpg copilot loaded ###');

// 是否自动进入采集事件
let autoGatherer = GM_getValue('autoGatherer', 'yes') === 'yes';
let autoBoss = GM_getValue('autoBoss', true);
let pushKey = GM_getValue('pushKey', '');
let resetActionCount = GM_getValue('resetCount', 30)

function init() {

    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(console.log);
    }

    initPushKeyMenu()
    initSettingMenu()
    initActionCountMenu();

    const {ele} = getAutoEle()
    if (ele) {
        // 已经进入游戏页面
        clickAction();
        initAutoAction()
    } else {
        setTimeout(init, 2000)
    }
}

function initActionCountMenu() {
    GM_registerMenuCommand(`剩余行动低于${resetActionCount}时随机重置`, function () {
        const input = prompt("请在下方输入你的计数，填空则保持原值：")

        if (input) {
            resetActionCount = parseInt(input);
            GM_setValue('resetCount', resetActionCount)
        }

        initActionCountMenu();
    }, {
        id: 'setting_reset_count'
    });
}

function initSettingMenu() {
    GM_registerMenuCommand(`自动采集事件：${autoGatherer ? '已开启' : "已关闭"}`, function () {
        autoGatherer = !autoGatherer;
        GM_setValue('autoGatherer', autoGatherer ? 'yes' : 'no');
        initSettingMenu();
    }, {
        id: "setting_auto_gatherer",
    });

    GM_registerMenuCommand(`自动Boss事件：${autoBoss ? '已开启' : "已关闭"}`, function () {
        autoBoss = !autoBoss;
        GM_setValue('autoBoss', autoBoss);
        initSettingMenu();
    }, {
        id: "setting_auto_boss",
    });
}

function initPushKeyMenu() {

    GM_registerMenuCommand(pushKey ? `当前key:${pushKey.substring(0, 8)}...` : "设置推送Key", function () {
        const input = prompt("请在下方输入你的key,填空则关闭推送(获取：https://sct.ftqq.com/)：")

        pushKey = input || '';
        GM_setValue('pushKey', input)

        initPushKeyMenu();
    }, {
        id: 'setting_push_key'
    });
}

function initAutoAction() {
    console.log('initAuto')

    setInterval(_ => {
        // 检查是否有谷歌验证码
        if (checkRecaptcha()) {
            console.log('recaptcha')
            return;
        }

        checkEvent();
        checkRaid();

        const {ele, left} = getAutoEle()
        if (left < resetActionCount) {
            if (Math.random() * resetActionCount >= left) {
                console.log(left, 'click')
                ele.click()
            }
        }

    }, 5000)
}

let isFighting = false;
let isDoingEvent = false;
let lastBossCount = 0;

function checkEvent() {
    let bossEle;
    let eventEle;
    let currentBossCount = 0
    document.querySelectorAll(".main-section__title.clickable.highlighted").forEach(ele => {
        const txt = ele.querySelector('p').innerText
        if (txt === 'Boss') {
            currentBossCount = ele.parentElement.querySelectorAll('.clickable.boss').length;
            bossEle = ele.parentElement.querySelector('.clickable.boss');
        }
        if (['Event', '事件'].includes(txt)) {
            eventEle = ele.parentElement.querySelector('a');
        }
    })
    if (bossEle) {
        if (currentBossCount > lastBossCount) {
            console.log(`${currentBossCount} boss`)
        }
        if (currentBossCount < lastBossCount) {
            console.log('少了一个boss')
            isFighting = false;
        }
        if (!isFighting && autoBoss) {
            console.log('goto boss')
            bossEle.click()
            isFighting = true;
            isDoingEvent = false;
        }
    } else {
        if (isFighting) {
            console.log('boss 打完了')
            isFighting = false;
        }
        if (eventEle && autoGatherer) {
            if (!isDoingEvent) {
                console.log('goto event')
                eventEle.click()
                isDoingEvent = true;
            }
        }
    }

    if (isDoingEvent && !eventEle) {
        console.log('event 结束了')
        isDoingEvent = false;
    }
    lastBossCount = currentBossCount;
}


function getAutoEle() {
    const ele = document.querySelector(".action-timer__text")
    let left = 0;
    if (ele) {
        left = parseInt(ele.innerText.match(/\d+/)[0])
    }

    return {
        ele,
        left
    }
}

function clickAction() {
    let i = 1;

    const defaultAction = localStorage.getItem('defaultAction')
    switch (defaultAction) {
        case 'battling':
            i = 1;
            break;
        case 'mining':
            i = 2;
            break;
        case 'woodcutting':
            i = 3;
            break;
        case 'quarrying':
            i = 4;
            break;
    }

    const ele = document.querySelector(`.main-section__title>p>div>a:nth-child(${i})`);
    if (ele) {
        ele.click();
    }
}

let isNotifiedRaid = false;

function checkRaid() {
    const ele = document.querySelector('a[href="/land/raids"].yellow-text')
    if (ele) {
        if (!isNotifiedRaid) {
            new Notification('扫荡完毕', {
                body: '请手动处理'
            });
            isNotifiedRaid = true;
        }
    } else {
        isNotifiedRaid = false;
    }
}

let isNotifiedRecaptcha = false;
let isPushed = false;

function checkRecaptcha() {
    const result = !!document.querySelector('#g-recaptcha')
    if (result && !isNotifiedRecaptcha) {
        new Notification('有验证码', {
            body: '请手动验证'
        });
        isNotifiedRecaptcha = true;
        if (!isPushed && pushKey) {
            isPushed = true;
            fetch(`https://sctapi.ftqq.com/${pushKey}.send?title=iqrpg出现验证码辣`).then(() => console.log('pushed'))
        }

        // 1分钟后重置, 再次提醒，防止看漏
        setTimeout(() => {
            isNotifiedRecaptcha = false;
        }, 1000 * 60)
    }
    if (!result) {
        isNotifiedRecaptcha = false
        if (isPushed) {
            isPushed = false
        }
    }
    return result;
}

init()