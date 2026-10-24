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

/**
 * The usual prose endings are included, examples (look at what the quotes wrap):
 * - "Word," phrase. "Exclamation!"
 * - Noun verb, "Word."
 * - Adjective noun, "Word?"
 *
 * These never happen (to me, at least):
 * - "Word:" adverb noun.
 *
 * `;:-` is not a sentence ending characters to me, personally.
 */
const REGEX_NO_PAIR_LEFT = /[\w,.?!]/;
const REGEX_NO_PAIR_RIGHT = /\w/;

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

    // Escape character check, \( and \\() cases
    // could be more elegant?
    if (countCharFromCursor("\\", inputField) % 2 !== 0) {
        return;
    }

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
 * @param {string} toFind
 * @param {HTMLInputElement} inputField
 * @param {boolean} checkLeft defaults true
 * @returns {void}
 */
function countCharFromCursor(toFind, inputField, checkLeft = true) {
    const value = inputField.value;
    const startIndex = checkLeft
        ? inputField.selectionStart - 1
        : inputField.selectionEnd;
    const valueNudge = checkLeft ? -1 : 1;

    let count = 0;
    for (let i = startIndex; value[i] === toFind; i += valueNudge) {
        count += 1;
    }
    return count;
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

    // if selecting text wrap them unconditionally
    // code will never reach here if the keys are not on VALID_CHARS
    // in the first place
    // matches VSCode "quoting" with selection
    if (cursorLeft !== cursorRight) {
        addClosing(inputField, key);
        return;
    }

    // as all of the selection logic is caught above, everything else is assumed
    // non selection pairing. maybe.

    // o/x cursor x BUT some checking on char besides the cursor
    if (!isRightMatch) {
        // basically requires a space or non REGEX_NO_PAIR_* to pair now
        // left check: sentence ends + \w
        // right check: only \w
        // so I can fix these cases: |word" "Word?|
        // but not word <space> |. and its derivatives. personal preference
        // TODO: make this configurable, actually: the entire extension.
        if (REGEX_NO_PAIR_LEFT.test(leftChar) || REGEX_NO_PAIR_RIGHT.test(rightChar)) {
            inputField.setRangeText(key, cursorLeft, cursorRight, "end");
            inputField.setSelectionRange(cursorLeft + 1, cursorRight + 1);
            return;
        }
    }

    // x cursor x
    if (!isLeftMatch && !isRightMatch) {
        addClosing(inputField, key);
        return;
    }

    // o/x cursor o
    if (isRightMatch) {
        onClosingTyped(inputField, key);
        return;
    }

    // o cursor x
    if (isLeftMatch && !isRightMatch) {
        // add it first
        inputField.setRangeText(key, cursorLeft, cursorRight, "end");

        // then, if ``` create a code fence!
        if (key === "`" && countCharFromCursor("`", inputField) === 3) {
            inputField.setRangeText("\n```", cursorLeft + 1, cursorLeft + 1, "end");
        }

        // or if *** (bold italic), wrap!
        else if (key === "*" && countCharFromCursor("*", inputField) === 3) {
            inputField.setRangeText("***", cursorLeft + 1, cursorLeft + 1, "end");
        }

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
