// ==UserScript==
// @name         iqrpg-copilot
// @version      0.0.1
// @description  auto loop/boss
// @author       ABang
// @match        https://www.iqrpg.com/game.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iqrpg.com
// @grant        none
// ==/UserScript==

console.log('### iqrpg copilot loaded ###');

// 是否自动进入采集事件
const autoGatherer = true;

// const autoAction = 1 // 1.战斗 2.采矿 3.伐木 4.采石 // 直接读取 defaultAction，无需手动配置了

function init() {
    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(console.log);
    }
    const {ele} = getAutoEle()
    if (ele) {
        // 已经进入游戏页面
        clickAction();
        initAutoAction()
    } else {
        setTimeout(init, 2000)
    }
}

function initAutoAction() {
    console.log('initAuto')

    const timer = setInterval(e => {
        // 检查是否有谷歌验证码
        if (checkRecaptcha()) {
            console.log('recaptcha')
            return;
        }

        checkEvent();
        checkRaid();

        const {ele, left} = getAutoEle()
        if (left < 100) {
            if (Math.random() * 100 > left) {
                console.log(left, 'click')
                ele.click()
            }
        }

    }, 5000)
}

let isFighting = false;
let isDoingEvent = false;

function checkEvent() {
    let bossEle;
    let eventEle;
    document.querySelectorAll(".main-section__title.clickable.highlighted").forEach(ele => {
        const txt = ele.querySelector('p').innerText
        if (txt === 'Boss') {
            bossEle = ele.parentElement.querySelector('.clickable.boss');
        }
        if (['Event', '事件'].includes(txt)) {
            eventEle = ele.parentElement.querySelector('a');
        }
    })
    if (bossEle) {
        if (!isFighting) {
            console.log('goto boss')
            bossEle.click()
            isFighting = true;
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
            new Notification('有raid', {
                body: '请手动处理'
            });
            isNotifiedRaid = true;
        }
    } else {
        isNotifiedRaid = false;
    }
}

let isNotifiedRecaptcha = false;

function checkRecaptcha() {
    const result = !!document.querySelector('#g-recaptcha')
    if (result && !isNotifiedRecaptcha) {
        new Notification('有验证码', {
            body: '请手动验证'
        });
        isNotifiedRecaptcha = true;

        // 1分钟后重置, 再次提醒，防止看漏
        setTimeout(() => {
            isNotifiedRecaptcha = false;
        }, 1000 * 60)
    }
    if (!result) {
        isNotifiedRecaptcha = false
    }
    return result;
}

init()
