// ==UserScript==
// @name             Svelte REPL in claude
// @namespace        https://github.com/sokripon/tampermonkeyscripts/
// @version          1.1
// @description      Ability to load code into svelte REPL from URL hash or query, and generate shareable links for other users. Also adds support for embedding svelte REPL in claude.ai chat.
// @match            https://svelte.dev/repl/*
// @match            https://claude.ai/chat/*
// @grant            none
// @author           sokripon
// @contributionURL  https://github.com/sokripon/tampermonkeyscripts/
// @supportURL       https://github.com/sokripon/tampermonkeyscripts/issues/
// ==/UserScript==

(function () {
	'use strict';

	let originalCode = null;
	let firstLoad = true;

	function replaceCodeblockWithIFRAME(codeBlock) {
		const parentDiv = codeBlock.parentElement;

		// Get the code
		const code = codeBlock.textContent;

		// Create the iframe for svelte REPL
		const iframe = document.createElement('iframe');

		// Set the src attribute with the encoded code
		const encodedCode = encodeURIComponent(code);
		iframe.src = `https://svelte.dev/repl/hello-world/embed?version=4.2.18#${encodedCode}`;

		// Set some styling for the iframe
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.border = 'none';

		// Replace artifact with svelte REPL iframe
		parentDiv.parentNode.replaceChild(iframe, parentDiv);
	}

	function embedSvelteReplIn(node) {
		const loadingArtifact = document.querySelector('span[class="sr-only"]');
		// if this element is present, it means that claude is still working on the artifact
		if (loadingArtifact) {
			return;
		}
		const codeBlocks = node.querySelectorAll('div.h-fit > code.language-svelte');
		if (codeBlocks.length > 0) {
			codeBlocks.forEach((codeBlock) => {
				console.log('Svelte code block found');
				replaceCodeblockWithIFRAME(codeBlock);
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

	// Function to get the appropriate window (iframe or main)
	function getWindow() {
		const iframe = findReplIframe();
		return iframe ? iframe.contentWindow : window;
	}

	// Function to find the editor element
	function findEditor() {
		const doc = getDocument();
		const possibleEditors = doc.querySelectorAll('textarea, [contenteditable="true"]');
		return possibleEditors[0];
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

		editor.dispatchEvent(new Event('input', { bubbles: true }));
		editor.dispatchEvent(new Event('change', { bubbles: true }));
	}

	function getCodeFromHash() {
		return window.location.hash.replace(/^#/, '');
	}

	function getCodeFromQuery() {
		return new URLSearchParams(window.location.href).get('code');
	}

	function getCodeFromUrl() {
		let hashCode = getCodeFromHash();
		let queryCode = getCodeFromQuery();
		if (hashCode) {
			return decodeURIComponent(hashCode);
		}
		if (queryCode) {
			return decodeURIComponent(queryCode);
		}
		return null;
	}

	// Function to load code from URL
	function loadCodeFromUrl() {
		if (firstLoad && originalCode !== null) {
			firstLoad = false;
			setEditorContent(originalCode);
			console.log('Code loaded from URL');
			return;
		}
		const code = getCodeFromUrl();
		if (code && code !== originalCode) {
			originalCode = code;
			setEditorContent(code);
			console.log('Code loaded from URL');
		} else if (!code) {
			console.log('No code found in URL!');
		}
	}

	// Run on page load and when URL changes
	function init() {
		// Store the original code from the URL
		originalCode = getCodeFromUrl();
		// Wait a bit so everything can load
		setTimeout(() => {
			loadCodeFromUrl();
		}, 1000);

		getWindow().addEventListener('hashchange', loadCodeFromUrl);
	}

	if (window.location.href.startsWith('https://svelte.dev/repl')) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', init);
		} else {
			console.log('Init bruv');
			init();
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
