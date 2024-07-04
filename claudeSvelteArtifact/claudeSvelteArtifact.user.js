// ==UserScript==
// @name             Svelte REPL in claude
// @namespace        https://github.com/sokripon/tampermonkeyscripts/
// @version          1.5
// @description      Adds support for embedding svelte REPL in claude.ai chat.
// @match            https://svelte.dev/repl/*
// @match            https://claude.ai/chat/*
// @grant            none
// @author           sokripon
// @contributionURL  https://github.com/sokripon/tampermonkeyscripts/
// @supportURL       https://github.com/sokripon/tampermonkeyscripts/issues/
// @downloadURL      https://github.com/sokripon/tampermonkeyscripts/raw/main/claudeSvelteArtifact/claudeSvelteArtifact.user.js
// @updateURL        https://github.com/sokripon/tampermonkeyscripts/raw/main/claudeSvelteArtifact/claudeSvelteArtifact.user.js
// ==/UserScript==

(function () {
	'use strict';

	// https://stackoverflow.com/a/61511955/12580887
	function waitForElm(selector) {
		return new Promise((resolve) => {
			if (document.querySelector(selector)) {
				return resolve(document.querySelector(selector));
			}

			const observer = new MutationObserver((mutations) => {
				if (document.querySelector(selector)) {
					observer.disconnect();
					resolve(document.querySelector(selector));
				}
			});

			// If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		});
	}

	function addReplToCodeblock(codeBlock) {
		/** @type {HTMLElement} */
		const parentDiv = codeBlock.parentElement;
		console.debug(`Parent div: ${parentDiv}`);
		const artifactHeaderDiv = parentDiv.parentElement.parentElement.firstChild;
		console.debug(`Artifact header div: ${artifactHeaderDiv}`);
		const artifactHeaderTitleDiv = artifactHeaderDiv.firstChild;
		console.debug(`Artifact header title div: ${artifactHeaderTitleDiv}`);

		// Get the code from the code block
		const code = codeBlock.textContent;

		// Hide the parent div
		parentDiv.style.display = 'none';

		// Create the iframe for svelte REPL
		const iframe = document.createElement('iframe');
		iframe.id = 'svelteReplIframe';

		// Set the src attribute with the encoded code
		const encodedCode = encodeURIComponent(code);
		iframe.src = `https://svelte.dev/repl/7e349e6885dd4e23a9b8a8e0786fee39/embed?version=4.2.18`;

		// Set some styling for the iframe
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.border = 'none';

		// Insert the iframe after the hidden parent div
		parentDiv.parentNode.insertBefore(iframe, parentDiv.nextSibling);
		// Button to toggle the REPL visibility
		const toggleButton = document.createElement('button');
		toggleButton.textContent = 'Hide REPL';
		toggleButton.id = 'toggleButtonSvelteRepl';

		// Style the button
		toggleButton.style.border = 'none';
		toggleButton.style.paddingLeft = '10px';
		toggleButton.style.fontSize = '14px';
		toggleButton.style.cursor = 'pointer';

		toggleButton.onclick = function () {
			if (parentDiv.style.display === 'none') {
				parentDiv.style.display = '';
				iframe.style.display = 'hidden';
				toggleButton.textContent = 'Show REPL';
				console.debug(`Clicked toggle button, hiding iframe by setting display to 'none'`);
			} else {
				parentDiv.style.display = 'none';
				iframe.style.display = '';
				toggleButton.textContent = 'Hide REPL';
				console.debug(`Clicked toggle button, showing iframe by setting display to ''`);
			}
		};
		// Button to open the REPL in a new tab
		const openReplButton = document.createElement('button');
		openReplButton.textContent = 'Open REPL Tab';
		openReplButton.id = 'openReplButtonSvelteRepl';
		openReplButton.style.border = 'none';
		openReplButton.style.paddingLeft = '10px';
		openReplButton.style.fontSize = '14px';
		openReplButton.style.cursor = 'pointer';
		openReplButton.onclick = function () {
			window.open(
				`https://svelte.dev/repl/7e349e6885dd4e23a9b8a8e0786fee39?version=4.2.18#${encodedCode}`,
				'_blank'
			);
		};
		let prevOpenReplButton = artifactHeaderDiv.querySelector('#openReplButtonSvelteRepl');
		if (prevOpenReplButton) {
			prevOpenReplButton.remove();
		}
		let prevToggleButton = artifactHeaderDiv.querySelector('#toggleButtonSvelteRepl');
		if (prevToggleButton) {
			prevToggleButton.remove();
			if (prevToggleButton.textContent === 'Hide REPL') {
				parentDiv.style.display = 'none';
				iframe.style.display = '';
				toggleButton.textContent = 'Hide REPL';
			} else {
				parentDiv.style.display = '';
				iframe.style.display = 'hidden';
				toggleButton.textContent = 'Show REPL';
			}
		}
		artifactHeaderTitleDiv.appendChild(openReplButton);
		artifactHeaderTitleDiv.appendChild(toggleButton);

		window.addEventListener('message', function (e) {
			if (e.origin !== 'https://svelte.dev') {
				console.error('Received message from invalid origin');
				return;
			}
			if (e.data === 'ready') {
				sendCodeToIframe(code);
			}
		});
	}

	function sendCodeToIframe(code) {
		const iframe = document.getElementById('svelteReplIframe');
		if (!iframe) {
			console.error('Could not find the iframe');
			return;
		}
		iframe.contentWindow.postMessage(code, 'https://svelte.dev/repl');
	}

	function sendReadyToParentWhenReady() {
		runWhenEditorReady(() => {
			console.debug('Editor element found');
			window.parent.postMessage('ready', 'https://claude.ai');
		});
	}

	function runWhenEditorReady(callback) {
		waitForElm('[contenteditable="true"]:not([aria-readonly])').then((elm) => {
			callback();
		});
	}

	function embedSvelteReplIn(node) {
		const loadingArtifact = document.querySelector('span[class="sr-only"]');
		// if this element is present, it means that claude is still working on the artifact
		const codeBlocks = node.querySelectorAll('div.h-fit > code.language-svelte');
		if (!loadingArtifact && codeBlocks.length > 0) {
			codeBlocks.forEach((codeBlock) => {
				addReplToCodeblock(codeBlock);
			});
		}
	}

	// Function to find the REPL iframe if it exists
	function findReplIframe() {
		return Array.from(document.getElementsByTagName('iframe')).find((iframe) =>
			iframe.src.startsWith('https://svelte.dev/repl')
		);
	}

	// Function to get the appropriate document (iframe or main)
	function getDocument() {
		const iframe = findReplIframe();
		return iframe ? iframe.contentDocument : document;
	}

	// Function to find the editor element
	function findEditor() {
		const doc = getDocument();
		const editor = doc.querySelector('[contenteditable="true"]:not([aria-readonly])');
		return editor;
	}

	// Function to set the editor content
	function setEditorContent(content) {
		const editor = findEditor();
		if (!editor) {
			console.error('Could not find the editor element');
			return;
		}
		if (editor.tagName.toLowerCase() === 'textarea') {
			editor.value = content;
		} else {
			editor.innerText = content;
		}
	}

	function getCodeFromHash() {
		const hash = window.location.hash.replace(/^#/, '');
		if (!hash) {
			return;
		}
		const code = decodeURIComponent(hash);
		return code;
	}

	if (window.location.href.startsWith('https://svelte.dev/repl')) {
		console.debug('In svelte.dev/repl');
		if (window !== window.parent) {
			window.addEventListener('message', function (e) {
				/** @type {MessageEvent} */
				// Get the sent data
				if (e.origin !== 'https://claude.ai') {
					return;
				}
				setEditorContent(e.data);
			});
			sendReadyToParentWhenReady();
		} else {
			const code = getCodeFromHash();
			if (code) {
				runWhenEditorReady(() => {
					setEditorContent(code);
				});
			}
		}
	}

	if (window.location.href.startsWith('https://claude.ai/chat')) {
		let observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				// To check if new artifacts are added for example when opening an artifact
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType !== Node.ELEMENT_NODE) {
						return;
					}
					embedSvelteReplIn(node);
				});
				// This is to check if claude finished working on the artifact
				mutation.removedNodes.forEach((node) => {
					if (node.nodeType !== Node.ELEMENT_NODE) {
						return;
					}
					const loadingArtifact = node.querySelector('span[class="sr-only"]');
					if (loadingArtifact) {
						embedSvelteReplIn(document.body);
					}
				});
			});
		});
		observer.observe(document.body, { childList: true, subtree: true });
	}
})();
