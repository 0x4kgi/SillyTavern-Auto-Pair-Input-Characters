const EXTENSION_NAME = "SillyTavern-Auto-Pair-Input-Characters";

// Its here since on mobile the selectionStart and End is different
// see deletePair::leftChar
// also initialized globally, to not refetch it
// just refresh the page if somehow the platform changes
const isMobile = SillyTavern.getContext().isMobile();

const PAIRS = {
    '"': '"',
    "'": "'",
    "*": "*",
    "`": "`",
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">",
};
const INVERSE_PAIRS = Object.fromEntries(
    Object.entries(PAIRS).map(([key, value]) => [value, key])
);

// cache regexes here
const REGEX_WORD = /\w/;

const OPEN_CHARS = new Set(Object.keys(PAIRS));
const CLOSE_CHARS = new Set(Object.keys(INVERSE_PAIRS));
const VALID_CHARS = new Set([...OPEN_CHARS, ...CLOSE_CHARS]);

const VALID_INPUT_TYPE = [
    "insertText",
    "deleteContentBackward",
];

function log(...args) {
    console.log(`[${EXTENSION_NAME}]`, ...args);
}
["warn", "error"].forEach(item => {
    log[item] = function (...args) {
        console[item](`[${EXTENSION_NAME}]`, ...args);
    }
});

/** @param {InputEvent} event */
function onInput(event) {
    /** @type {HTMLInputElement} */
    const inputField = event.target;
    const inputType = event.inputType;
    const key = event.data;

    if (!VALID_INPUT_TYPE.includes(inputType)) return;

    if (event.isComposing) return;

    if (inputType.includes("delete")) {
        deletePair(event);
        return;
    }

    if (!VALID_CHARS.has(key)) return;

    let keyIsOpen = OPEN_CHARS.has(key);
    let keyIsClose = CLOSE_CHARS.has(key);

    // ( { [ <
    if (keyIsOpen && !keyIsClose) {
        event.preventDefault();
        addClosing(inputField, key);
        return;
    }

    // ) } ] >
    if (!keyIsOpen && keyIsClose) {
        event.preventDefault();
        onClosingTyped(inputField, key);
        return;
    }

    // * " `
    if (keyIsOpen && keyIsClose) {
        event.preventDefault();
        identicalPair(inputField, key);
        return;
    }
}

/**
 * @param {HTMLInputElement} inputField
 * @param {string} key
 * @returns {void}
 */
function addClosing(inputField, key) {
    let pair = {
        open: key,
        close: PAIRS[key],
    };

    if (!pair.close) return;

    const cursorLeft = inputField.selectionStart;
    const cursorRight = inputField.selectionEnd;
    const value = inputField.value;
    const selectedText = value.substring(cursorLeft, cursorRight);
    const replacement = `${pair.open}${selectedText}${pair.close}`;

    inputField.setRangeText(replacement, cursorLeft, cursorRight, "end");
    inputField.setSelectionRange(cursorLeft + 1, cursorRight + 1);
}

/**
 * @param {HTMLInputElement} inputField
 * @param {string} key
 * @returns {void}
 */
function onClosingTyped(inputField, key) {
    const pair = {
        open: INVERSE_PAIRS[key],
        close: key,
    };

    const cursorLeft = inputField.selectionStart;
    const cursorRight = inputField.selectionEnd;
    const value = inputField.value;

    const nextCharacter = value.charAt(cursorRight);

    if (nextCharacter !== pair.close) {
        inputField.setRangeText(pair.close, cursorLeft, cursorRight, "end");
    }

    inputField.setSelectionRange(cursorLeft + 1, cursorLeft + 1);
}

/**
 * @param {HTMLInputElement} inputField
 * @param {string} key
 * @returns {void}
 */
function identicalPair(inputField, key) {
    const cursorLeft = inputField.selectionStart;
    const cursorRight = inputField.selectionEnd;
    const value = inputField.value;

    const leftChar = value.charAt(cursorLeft - 1) || "";
    const rightChar = value.charAt(cursorRight) || "";

    const isLeftMatch = key === leftChar;
    const isRightMatch = key === rightChar;

    // o cursor o AND has selected text
    // wrap them, regardless if the pairs are already beside the cursor
    // VS code behavior with "double quotes"
    // a bit odd for **bold** (or ***italic bold***) and ```code block``` syntaxes...
    if ((cursorLeft !== cursorRight) && (isLeftMatch && isRightMatch)) {
        addClosing(inputField, key);
        return;
    }

    // x cursor x BUT the leftChar is /\w/
    // takes precedence over everything, and only applicable to the single quote
    // and not selecting a range!!
    if (key === "'" && (cursorLeft == cursorRight) && !isRightMatch) {
        if (REGEX_WORD.test(leftChar)) {
            // don't, won't, doesn't, etc...
            // /\w/ cursor key, don't apply pairs, just add it
            inputField.setRangeText(key, cursorLeft, cursorRight, "end");
            inputField.setSelectionRange(cursorLeft + 1, cursorRight + 1);
            return;
        }
    }

    // x cursor x
    // separated chunk, to not have a long if statement line
    if (!isLeftMatch && !isRightMatch) {
        addClosing(inputField, key);
        return;
    }

    // x cursor o OR o cursor o
    if ((!isLeftMatch && isRightMatch) || (isLeftMatch && isRightMatch)) {
        onClosingTyped(inputField, key);
        return;
    }

    // o cursor x
    if (isLeftMatch && !isRightMatch) {
        // just add it
        inputField.setRangeText(key, cursorLeft, cursorRight, "end");
        inputField.setSelectionRange(cursorLeft + 1, cursorRight + 1);
        return;
    }
}

/**
 * @param {InputEvent} event
 */
function deletePair(event) {
    /** @type {HTMLInputElement} */
    const inputField = event.target;

    const cursorLeft = inputField.selectionStart;
    const cursorRight = inputField.selectionEnd;
    const value = inputField.value;

    // Deletion works differently in mobile...
    // selects THEN delete. Hence the offset (or lack thereof) here.
    const cursorOffset = isMobile ? 0 : 1;

    const leftChar = value.charAt(cursorLeft - cursorOffset) || "";
    const rightChar = value.charAt(cursorRight) || "";

    // The following two are additional checks added for isMobile
    if (isMobile && ((cursorRight - cursorLeft) !== 1)) return;
    if (!isMobile && (cursorLeft !== cursorRight)) return;

    if (!OPEN_CHARS.has(leftChar)) return;
    if (PAIRS[leftChar] !== rightChar) return;

    event.preventDefault();

    inputField.setRangeText("", cursorLeft - cursorOffset, cursorRight + 1, "end");
}

function main() {
    document.addEventListener('beforeinput', onInput);
    log("Extension loaded.");
}

main();
