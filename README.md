# SillyTavern Auto Pair Input Characters

Automatically pairs or closes the following characters when typing:

- `"` (double quotes)
- `'` (single quotes)
- `*` (asterisk)
- `(` (open parenthesis)
- `[` (open square bracket)
- `{` (open curly bracket)
- `<` (less than sign, for HTML)
- <code>`</code> (single backtick)

## Features

Zero setup. It works in **ALL** text inputs.

If you're used to VS Code completion, it should feel the same. Typing an "opening" character while having selection will wrap it too!

## Installation and Usage

### Installation

Using ST's built-in installer

```
https://github.com/0x4kgi/SillyTavern-Auto-Pair-Input-Characters
```

### Usage

Just type anywhere, you'll see it work.

## Todo
- [x] `'` ~~adding single quote support~~ (DONE: [0.1.2](https://github.com/0x4kgi/SillyTavern-Auto-Pair-Input-Characters/commit/06ca6dfa525fe35846035ad70a1263967aaaa598))
  - if the single quote is used on contractions (don't, won't, doesn't, etc.) it will not add the closing single quote
- [x] ~~`\` escape detection~~ (DONE: 0.2.0)
  - typing `\[`, `\"` or any valid symbols will block it from adding its closing pair
  - `\\""` escaped backslash should be ignored
- [x] ~~<code>```</code> code fences detection~~ (DONE: [0.2.0](https://github.com/0x4kgi/SillyTavern-Auto-Pair-Input-Characters/commit/41befda3d0d194ad3b28c4feaf98201e3ebe56ce))
- [ ] probably a settings panel
- [ ] *will add more todos if i feel like it*

## License

**Unlicense**
