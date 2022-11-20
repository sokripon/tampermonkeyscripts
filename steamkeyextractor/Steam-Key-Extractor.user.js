// ==UserScript==
// @name         Steam key extractor
// @namespace    https://github.com/sokripon/tampermonkeyscripts/
// @license MIT
// @version      0.1
// @description  Extract Steam keys from Websites using regex
// @author       sokripon
// @match        https://*/*
// @match        http://*/*
// @run-at context-menu
// @icon         https://raw.githubusercontent.com/sokripon/tampermonkeyscripts/main/steamkeyextractor/icon.png
// @supportURL   https://github.com/sokripon/tampermonkeyscripts/issues/
// @contributionURL https://github.com/sokripon/tampermonkeyscripts/
// ==/UserScript==

var box = document.createElement('div');
box.id = 'keyCopyBox';
box.style.cssText =
    'z-index: 69;                               ' +
    'background-color: #1B2226;                 ' +
    'border: solid 1px #262D30;                 ' +
    'border-radius: 5px;                        ' +
    'position: absolute;                        ' +
    'left: 50%;                                 ' +
    'top: 300px;                                ' +
    'transform: translate(-50%, -50%);          ' +
    'display: grid;                             ' +
    'grid-template-columns: max-content 350px;  ' +
    'color: white;                              ' +
    'white-space: pre-wrap;                     ' +
    'box-sizing: border-box;                    ';


let re = /[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}/
let res = []
document.querySelectorAll('*').forEach(function (node) {
    var value = node.innerHTML
    if (value.match(re)) {
        var key = value.match(re)[0]
        if (!res.includes(key)) {
            res.push(key)

        }
    }
});

var text = res.join('\r\n')
if (text == '') { text = 'Found nothing' }
box.textContent = text;
document.body.appendChild(box);
var closeButton = document.createElement('div');
closeButton.className = 'closeButton';
closeButton.textContent = 'Close';
closeButton.style.cssText =
    ' background: #aaa;       ' +
    ' border: 1px solid #777; ' +
    ' padding: 1px;           ' +
    ' margin: 1px;            ' +
    ' float: left;            ' +
    ' width: inherit;         ' +
    ' color: white;           ' +
    ' cursor: pointer;        ';


box.insertBefore(closeButton, box.firstChild);

var copyButton = document.createElement('div');
copyButton.className = 'copyButton';
copyButton.textContent = 'Copy';
copyButton.style.cssText = closeButton.style.cssText


box.insertBefore(copyButton, box.firstChild);
closeButton.addEventListener('click', function () {
    box.parentNode.removeChild(box);
}, true);

copyButton.addEventListener('click', function () {
    navigator.clipboard.writeText(text)
    copyButton.textContent = "Copied"
    var lt = setInterval(function () {
        copyButton.textContent = "Copy";
        clearInterval(lt)
    }, 3000);
}, true);
