// ==UserScript==
// @name         iqrpg-copilot-ts
// @version      0.0.2
// @description  auto loop/boss
// @author       ABang
// @match        https://test.iqrpg.com/game.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iqrpg.com
// @updateURL    https://raw.githubusercontent.com/abangZ/iqrpg-scripts/main/iqrpg-copilot-ts.user.js
// @downloadURL  https://raw.githubusercontent.com/abangZ/iqrpg-scripts/main/iqrpg-copilot-ts.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * 使用本脚本可能违反游戏服务条款，导致账号封禁或其他后果，作者不承担任何责任。请用户自行评估风险。
 */

console.log('### iqrpg copilot loaded ###');

// 是否自动进入采集事件
// let autoGatherer = GM_getValue('autoGatherer', 'yes') === 'yes';
// 是否自动进入boss
let autoBoss = GM_getValue('autoBoss', true);
// 自动迷宫
let autoLabyrinth = GM_getValue('autoLabyrinth', true);

function init() {

    initSettingMenu()

    const { ele } = getAutoEle()
    if (ele) {
        // 已经进入游戏页面
        clickAction();
        initAutoAction()

        if (checkLabyrinthBox()) {
            console.log('已经有迷宫宝箱了，开一下')
            lastLabyrinthTime = Date.now();
        }

        // 把最后一个boss按钮点一下
        const bossBtns = document.querySelectorAll('.clickable.boss')
        if (bossBtns.length > 0) {
            const last = bossBtns[bossBtns.length - 1];
            const progress = last.querySelector('.progress__overlay')
            if (progress) {
                const width = progress.style.width;
                // 血量大于15%的，打一下
                if (width && parseInt(width) > 15) {
                    isFighting = true;
                    last.click()
                    setTimeout(() => {
                        isFighting = false;
                    }, 5 * 60 * 1000)
                }
            }
        }
        if (!isFighting) {
            doLabyrinth().catch(console.error);
        }
    } else {
        setTimeout(init, 2000)
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


function initSettingMenu() {
    // GM_registerMenuCommand(`自动采集事件：${autoGatherer ? '已开启' : "已关闭"}`, function () {
    //     autoGatherer = !autoGatherer;
    //     GM_setValue('autoGatherer', autoGatherer ? 'yes' : 'no');
    //     initSettingMenu();
    // }, {
    //     id: "setting_auto_gatherer",
    // });

    GM_registerMenuCommand(`自动Boss事件：${autoBoss ? '已开启' : "已关闭"}`, function () {
        autoBoss = !autoBoss;
        GM_setValue('autoBoss', autoBoss);
        initSettingMenu();
    }, {
        id: "setting_auto_boss",
    });

    GM_registerMenuCommand(`自动迷宫：${autoLabyrinth ? '已开启' : "已关闭"}`, function () {
        autoLabyrinth = !autoLabyrinth;
        GM_setValue('autoLabyrinth', autoLabyrinth);
        initSettingMenu();
    }, {
        id: "setting_auto_labyrinth",
    });
}


function initAutoAction() {
    console.log('initAuto')

    // 30秒检查一次
    setInterval(_ => {

        if (!isFighting) {
            autoBoss && checkEvent().catch(console.error);
            autoLabyrinth && checkLabyrinth();
        }

    }, 30000)
}

let isFighting = false;
async function checkEvent() {
    // 通过api来检查
    const res = await fetch('/php/_load_initial_data.php')
    const { bossData } = await res.json();
    if (bossData) {
        // {hpMax:6100000,hpRemaining:370934,id:164}[]
        bossData.forEach(e => {
            // console.log('boss',e.id, (e.hpRemaining / e.hpMax).toFixed(3))
            if (e.hpRemaining / e.hpMax > 0.2) {
                console.log('new boss')
                window.location.reload();
            }
        })

    }
}

let lastLabyrinthTime = 0;
function checkLabyrinth() {
    // 每小时的5分钟开始
    const date = new Date();
    date.setMinutes(5, 0, 0)
    if (lastLabyrinthTime < date.getTime() && Date.now() > date.getTime()) {
        lastLabyrinthTime = Date.now();
        doLabyrinth().catch(console.error);
    }

}

async function doLabyrinth() {
    console.log('doLabyrinth')

    // 进入迷宫主页
    document.querySelector('a[href="/labyrinth_home"]').click()

    // 进入迷宫
    for (let i = 0; i < 10; i++) {
        await sleep(1000)
        let ele = findEle('.main-section__body div div div button', '进入迷宫', 'Enter Labyrinth')

        // todo 也有可能是继续迷宫

        if (ele) {
            ele.click()
            break;
        } else if (i === 9) {
            console.log('没发现迷宫按钮')
            // 去首页
            document.querySelector('a[href="/"]').click()
            return;
        }
    }

    // 等待迷宫完成, 应该在10分钟内完成
    let start = Date.now();
    while (Date.now() - start < 1000 * 60 * 10) {
        await sleep(10000);
        // 检查是否完成
        if (checkLabyrinthBox()) {
            console.log('doLabyrinth success')
            return;
        }
    }
}

function checkLabyrinthBox() {
    const ele = findEle('button', '打开迷宫奖励宝箱', 'Open Labyrinth Reward Chest')
    if (ele) {
        ele.click()
        return true;
    }
    return false;
}

function findEle(selector, ...innerText) {
    const eles = document.querySelectorAll(selector)
    for (let i = 0; i < eles.length; i++) {
        const ele = eles[i];
        if (innerText.includes(ele.innerText)) {
            return ele;
        }
    }
    return null;
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

init()