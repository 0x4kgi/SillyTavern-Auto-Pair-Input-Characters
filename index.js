const EXTENSION_NAME = "SillyTavern-Auto-Pair-Input-Characters";

const PAIRS = {
    '"': '"',
    "*": "*",
    "`": "`",
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">",
};
const OPEN_CHARS = Object.keys(PAIRS);
const CLOSE_CHARS = Object.values(PAIRS);
const VALID_CHARS = [...OPEN_CHARS, ...CLOSE_CHARS];
const VALID_INPUT_TYPE = [
    "insertText",
    "deleteContentForward",
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

    if (inputType.includes("delete")) {
        deletePair(event, inputType);
        return;
    }

    if (!VALID_CHARS.includes(key)) return;

    let keyIsOpen = OPEN_CHARS.includes(key);
    let keyIsClose = CLOSE_CHARS.includes(key);

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
    const openChar = Object.keys(PAIRS).find(char => PAIRS[char] === key);
    const pair = {
        open: openChar,
        close: PAIRS[openChar],
    };

    const cursorLeft = inputField.selectionStart;
    const cursorRight = inputField.selectionEnd;
    const value = inputField.value;

    const nextCharacter = value.charAt(cursorRight);

    if (nextCharacter !== pair.close) {
        inputField.setRangeText(pair.close, cursorLeft, cursorRight, "end");
    }

    inputField.setSelectionRange(cursorLeft + 1, cursorRight + 1);
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

    // x cursor x OR o cursor o
    if ((!isLeftMatch && !isRightMatch) || (isLeftMatch && isRightMatch)) {
        addClosing(inputField, key);
        return;
    }

    // x cursor o
    if (!isLeftMatch && isRightMatch) {
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
 * @param {string} inputType
 */
function deletePair(event, inputType) {
    return; //temp, idk what to do yet lol

    /** @type {HTMLInputElement} */
    const inputField = event.target;

    const cursorLeft = inputField.selectionStart;
    const cursorRight = inputField.selectionEnd;
    const value = inputField.value;

    const stringLeft = value.substring()

    if (!OPEN_CHARS.includes(stringRight[0])) return;

    log("Deleting pair....");
}

function main() {
    document.addEventListener('beforeinput', onInput);
    log("Extension loaded.");
}

main();
