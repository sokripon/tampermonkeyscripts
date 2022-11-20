// ==UserScript==
// @name         Truffle.TV claimer
// @namespace    https://github.com/sokripon/tampermonkeyscripts/
// @version      0.1
// @description  Autoclaims channelpoints for Truffle.TV (a youtube extension)
// @author       sokripon
// @license      MIT
// @match        https://new.ludwig.social/*
// @icon         https://github.com/sokripon/tampermonkeyscripts/truffletvclaimer/icon.png
// @grant GM_log
// @supportURL   https://github.com/sokripon/tampermonkeyscripts/issues/
// @contributionURL https://github.com/sokripon/tampermonkeyscripts/
// ==/UserScript==

function click() {
    let element = document.querySelectorAll("[id*='channel-points']")[0];
    if (element){
        element = element.shadowRoot;
        if (element){
            element = element.querySelector(".claim");
            if (element){
                console.log("Found Claim Button, clicking");
                element.click();
            }
        }
    }
    setTimeout(click, Math.random() * 10000);
}
click()
