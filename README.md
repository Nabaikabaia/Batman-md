<div align="center">

```
██████╗  █████╗ ████████╗███╗   ███╗ █████╗ ███╗   ██╗    ███╗   ███╗██████╗
██╔══██╗██╔══██╗╚══██╔══╝████╗ ████║██╔══██╗████╗  ██║    ████╗ ████║██╔══██╗
██████╔╝███████║   ██║   ██╔████╔██║███████║██╔██╗ ██║    ██╔████╔██║██║  ██║
██╔══██╗██╔══██║   ██║   ██║╚██╔╝██║██╔══██║██║╚██╗██║    ██║╚██╔╝██║██║  ██║
██████╔╝██║  ██║   ██║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║    ██║ ╚═╝ ██║██████╔╝
╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝    ╚═╝     ╚═╝╚═════╝
```

# BATMAN MD

**A powerful, feature-rich WhatsApp Multi-Device bot powered by Baileys**

![Version](https://img.shields.io/badge/version-1.0.2-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-WhatsApp-brightgreen?style=for-the-badge&logo=whatsapp)
![Commands](https://img.shields.io/badge/commands-100%2B-orange?style=for-the-badge)

> Built by **NABEES TECH** — Multi-session hosting, group management, AI, media downloads, and much more.

</div>

---

## Table of Contents

- [Features](#-features)
- [Commands](#-commands)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Multi-Session Pairing](#-multi-session-pairing)
- [Project Structure](#-project-structure)
- [Adding New Commands](#-adding-new-commands)
- [Dependencies](#-core-dependencies)
- [FAQ](#-faq)
- [Credits](#-credits)
- [Legal](#-legal)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Device** | Works with WhatsApp's linked devices — no phone needs to stay online |
| 👥 **Multi-Session Hosting** | Users can link their own WhatsApp via `.pair` and run their own bot instance |
| 💾 **Dynamic Storage Limit** | Session slots are calculated from available disk space automatically |
| 🔄 **Auto-Restart** | Crashed user sessions are automatically restarted |
| 🌐 **Public / Private Mode** | Switch between public (everyone) and private (owner only) mode |
| 🛡️ **Group Moderation** | Anti-link, anti-bad-word, anti-tag, anti-delete, kick, ban, warn |
| 🤖 **AI Integration** | GPT, Gemini, Imagine, Flux, Sora image and text generation |
| 📥 **Media Downloader** | TikTok, Instagram, Facebook, YouTube (MP3/MP4), Spotify, GitHub |
| 🎨 **Sticker Maker** | Create, take, crop stickers; RemoveBG, Remini enhancement |
| 🔤 **Text Effects** | 19+ text style effects (fire, matrix, neon, glitch, and more) |
| 🎮 **Games** | Tic-Tac-Toe, Hangman, Trivia, 8-Ball, Truth or Dare |
| 🔌 **Configurable Prefix** | Change the command prefix in `settings.js` — no code changes needed |
| 📋 **Dynamic Help Menu** | Help menu auto-detects all commands from the `commands/` folder |
| 📰 **Newsletter Support** | Auto-follows and reacts to the bot's WhatsApp newsletter channel |

---

## 📋 Commands

> Default prefix: `.` — configurable in `settings.js`

<details>
<summary><b>🤖 AI</b></summary>

| Command | Description |
|---|---|
| `.gpt <text>` | Chat with GPT AI |
| `.gemini <text>` | Chat with Google Gemini |
| `.imagine <prompt>` | Generate an AI image (DALL-E style) |
| `.flux <prompt>` | Generate an image with Flux model |
| `.sora <prompt>` | Generate image/video with Sora |
| `.chatbot on/off` | Enable AI chatbot auto-reply in groups |

</details>

<details>
<summary><b>📥 Download</b></summary>

| Command | Description |
|---|---|
| `.play / .song / .mp3 <title>` | Download YouTube audio |
| `.video / .ytmp4 <title>` | Download YouTube video |
| `.spotify <title>` | Download from Spotify |
| `.tiktok / .tt <url>` | Download TikTok video |
| `.instagram / .insta <url>` | Download Instagram post or reel |
| `.facebook / .fb <url>` | Download Facebook video |
| `.gitclone <github-url>` | Download a GitHub repository as ZIP |
| `.igs <instagram-url>` | Download Instagram story |
| `.ss / .screenshot <url>` | Take a screenshot of a webpage |
| `.vv` | View a once-viewable message |
| `.url / .tourl` | Convert media to a URL link |
| `.tinyurl <url>` | Shorten a URL |

</details>

<details>
<summary><b>🎯 Fun</b></summary>

| Command | Description |
|---|---|
| `.compliment` | Send a compliment |
| `.insult` | Send a playful insult |
| `.flirt` | Send a flirt message |
| `.shayari` | Random Urdu/Hindi shayari poetry |
| `.goodnight` | Send a good night message |
| `.roseday` | Rose day message |
| `.ship @user1 @user2` | Ship two members together |
| `.simp` | Simp card generator |
| `.wasted` | Wasted overlay on a photo |
| `.fact` | Random interesting fact |
| `.joke` | Random joke |
| `.quote` | Inspirational quote |
| `.meme` | Random meme image |
| `.lyrics <song>` | Get song lyrics |

</details>

<details>
<summary><b>🎮 Games</b></summary>

| Command | Description |
|---|---|
| `.tictactoe / .ttt @user` | Play Tic-Tac-Toe with someone |
| `.hangman` | Start a Hangman game |
| `.guess <letter>` | Guess a letter in Hangman |
| `.trivia` | Start a trivia question |
| `.answer <answer>` | Answer the active trivia question |
| `.8ball <question>` | Ask the Magic 8-Ball |
| `.truth` | Get a random truth question |
| `.dare` | Get a random dare challenge |

</details>

<details>
<summary><b>👥 Group Management</b></summary>

| Command | Description |
|---|---|
| `.ban @user` | Ban a user from using the bot |
| `.unban @user` | Unban a user |
| `.promote @user` | Promote a member to group admin |
| `.demote @user` | Remove a member's admin status |
| `.kick @user` | Remove a member from the group |
| `.mute [minutes]` | Mute the group (all members) |
| `.unmute` | Unmute the group |
| `.warn @user` | Issue a warning to a user |
| `.warnings @user` | Check a user's warning count |
| `.antilink on/off` | Enable/disable anti-link protection |
| `.antibadword on/off` | Enable/disable bad word filter |
| `.antitag on/off` | Enable/disable anti-tag protection |
| `.antidelete on/off` | Show deleted messages to admins |
| `.tagall <message>` | Tag all group members |
| `.hidetag <message>` | Tag all members invisibly |
| `.welcome on/off` | Enable/disable welcome messages |
| `.goodbye on/off` | Enable/disable goodbye messages |
| `.resetlink / .revoke` | Reset the group invite link |
| `.groupinfo` | Show group information |
| `.admins / .staff` | List all group admins |
| `.setgname <name>` | Change the group name |
| `.setgdesc <text>` | Change the group description |
| `.setgpp` | Change the group profile photo |
| `.clear` | Clear the group chat |
| `.topmembers` | Show the most active members |
| `.delete / .del` | Delete a replied-to message |

</details>

<details>
<summary><b>🎨 Sticker / Photo</b></summary>

| Command | Description |
|---|---|
| `.sticker / .s` | Convert image or video to sticker |
| `.take / .steal` | Steal a sticker and re-pack it |
| `.crop` | Crop a sticker to square |
| `.simage` | Convert a sticker back to image |
| `.attp <text>` | Create an animated text sticker |
| `.removebg` | Remove image background |
| `.remini` | AI-enhance and upscale a photo |
| `.blur` | Apply blur effect to an image |
| `.emojimix / .emix` | Mix two emojis together |
| `.tgsticker` | Download a Telegram sticker pack |
| `.pies` | Country-themed stylish images |
| `.anime` | Anime-themed reaction stickers |

</details>

<details>
<summary><b>🔤 Text Effects</b></summary>

All text effects follow this pattern: `.<effect> <your text>`

`.metallic` `.ice` `.snow` `.impressive` `.matrix` `.light` `.neon` `.devil` `.purple` `.thunder` `.leaves` `.1917` `.arena` `.hacker` `.sand` `.blackpink` `.glitch` `.fire`

**Example:** `.fire Hello Batman`

</details>

<details>
<summary><b>🌐 General</b></summary>

| Command | Description |
|---|---|
| `.menu / .help / .list` | Show the full command menu |
| `.ping` | Check bot response speed |
| `.alive` | Show bot status and uptime |
| `.tts <text>` | Convert text to speech audio |
| `.owner` | Show bot owner contact |
| `.weather <city>` | Get weather forecast for a city |
| `.news` | Latest news headlines |
| `.translate / .trt <text>` | Translate text to English |
| `.git / .github / .repo` | View the bot's GitHub repository |
| `.jid` | Show group or user JID |
| `.settings` | View current bot settings |
| `.update` | Check for bot updates |

</details>

<details>
<summary><b>🔒 Owner Only</b></summary>

| Command | Description |
|---|---|
| `.mode public/private` | Switch bot access mode |
| `.autostatus on/off` | Auto view WhatsApp status updates |
| `.autoread on/off` | Auto read incoming messages |
| `.autotyping on/off` | Show typing indicator automatically |
| `.autoreact / .areact` | Auto-react to messages with an emoji |
| `.anticall on/off` | Block and reject incoming calls |
| `.pmblocker on/off` | Block DMs from unknown users |
| `.clearsession` | Clean up old session files |
| `.cleartmp` | Clear the temporary files folder |
| `.setpp` | Change the bot's profile picture |
| `.sudo` | Manage trusted sudo users |
| `.pair` | Generate a WhatsApp pairing code for multi-session |
| `.sessions` | View all active user sessions |

</details>

---

## 📦 Requirements

- **Node.js** v18.0.0 or higher
- **npm** v8 or higher
- A **WhatsApp** account (for linking)
- A server or hosting panel — VPS, Replit, Railway, Heroku, or a Pterodactyl panel

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Nabaikabaia/Batman-md.git
cd Batman-md
```

### 2. Install dependencies

```bash
npm install
```

If you encounter peer dependency errors:

```bash
npm install --legacy-peer-deps
```

### 3. Configure the bot

Edit `settings.js` with your details before starting (see [Configuration](#-configuration) below).

### 4. Start the bot

```bash
npm start
```

On first run the bot will output a **pairing code** in the terminal. Enter it in WhatsApp:

> WhatsApp → Settings → Linked Devices → Link a Device → **Link with phone number instead**

The bot is now connected and ready to use.

---

## ⚙️ Configuration

All user settings live in a single file: **`settings.js`**

```js
const settings = {
  packname:    'BATMAN MD',       // Sticker pack name shown on stickers
  author:      'NABEES TECH',     // Sticker author name
  botName:     'BATMAN MD',       // Bot display name used in menus
  botOwner:    'NABEES TECH',     // Your name shown in help menu
  ownerNumber: '2349049636843',   // Your WhatsApp number (with country code, no + or spaces)
  prefix:      '.',               // Command prefix — . ! / # etc.
  commandMode: 'public',          // 'public' = everyone  |  'private' = owner only
  version:     '1.0.2',
};
```

### Settings reference

| Setting | What it does |
|---|---|
| `ownerNumber` | Your number with country code, no `+` or spaces. Example: `2349012345678` |
| `prefix` | The character typed before every command. Change `.` to `!`, `/`, `#`, etc. — **no other files need editing** |
| `commandMode` | `public` lets all users run commands; `private` restricts them to owner and sudo users |
| `packname` / `author` | Shows inside stickers when someone holds them in WhatsApp |

---

## 🔗 Multi-Session Pairing

Batman MD can host multiple users from a single server. Each user links their own WhatsApp number and gets their own fully independent bot instance running in the background.

### How it works

```
sessions/
├── owner/                  ← Main bot session (never modified)
│   └── creds.json
├── 2348012345678/          ← User 1 (auto-created on .pair)
│   └── creds.json
└── 2349034567890/          ← User 2 (auto-created on .pair)
    └── creds.json
```

### Linking your WhatsApp (for users)

1. Send `.pair` to the main bot in any chat
2. The bot replies with a **6-character pairing code**
3. Open WhatsApp on your phone → **Settings → Linked Devices → Link a Device**
4. Tap **"Link with phone number instead"** and enter the code
5. Your personal bot session starts automatically — no further action needed

### Session limits — automatic disk-space detection

The bot calculates how many user sessions the server can safely host based on available disk space. Each session uses approximately **8 MB**.

| Free disk space | Estimated max sessions |
|---|---|
| 2 GB | ~200 sessions |
| 1 GB | ~100 sessions |
| 200 MB | ~20 sessions |

- A minimum of **200 MB** is always reserved as a safety buffer
- New pair requests are rejected automatically when storage runs low
- Existing sessions are never affected by the limit check

### Session safety features

- A number that already has an active session cannot pair again (prevents duplicates)
- Disconnected sessions auto-restart after a 10-second cooldown
- All active sessions are reloaded on bot restart — no manual intervention needed
- The main owner session is fully isolated and cannot be overwritten by user sessions

### Owner session commands

```
.sessions      — List all active user sessions and storage info
```

---

## 📂 Project Structure

```
Batman-MD/
├── index.js              # Entry point — Baileys connection, auth, event listeners
├── main.js               # Message router — all switch-case command handling
├── settings.js           # All user configuration (prefix, owner number, mode)
├── config.js             # API keys and global constants
│
├── commands/             # 100+ individual command files (auto-detected by help menu)
│   ├── ai.js
│   ├── gitclone.js       # GitHub repository downloader
│   ├── help.js           # Dynamic menu — scans commands/ folder at runtime
│   ├── pair.js           # Multi-session WhatsApp pairing
│   └── ...
│
├── lib/
│   ├── commandsMeta.js   # Command name → category mapping for the help menu
│   ├── sessionManager.js # Multi-session process spawning and lifecycle management
│   ├── antibadword.js
│   ├── antilink.js
│   ├── isAdmin.js
│   ├── isOwner.js
│   └── ...
│
├── data/                 # Persistent JSON storage (bans, warnings, group settings)
│   ├── banned.json
│   ├── warnings.json
│   └── ...
│
├── sessions/             # Auto-created — stores all Baileys session credentials
│   ├── owner/
│   └── <user-number>/
│
├── assets/               # Bot media files (profile image, menu music, sticker frames)
│   ├── bot_image.jpg
│   ├── menu.mp3
│   └── ...
│
└── temp/                 # Auto-cleaned temporary download files
```

---

## 🔧 Adding New Commands

Batman MD is built to make adding commands simple and consistent.

**Step 1 — Create the command file**

```js
// commands/greet.js
async function greetCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: 'Hello from Batman MD!' });
}
module.exports = greetCommand;
```

**Step 2 — Import it in `main.js`**

```js
const greetCommand = require('./commands/greet');
```

**Step 3 — Add a case in the switch block inside `main.js`**

```js
case cmd === '.greet':
    await greetCommand(sock, chatId, message);
    break;
```

**Step 4 — Register it in `lib/commandsMeta.js`**

```js
{ name: 'greet', category: 'General', file: 'greet' },
```

> Any `.js` file in `commands/` that is **not** listed in `commandsMeta.js` is automatically detected and shown under the **Other** section of the help menu — so users always see it, even if you forget to categorize it.

---

## 📦 Core Dependencies

| Package | Purpose |
|---|---|
| `@whiskeysockets/baileys` | WhatsApp Web multi-device API |
| `axios` | HTTP requests to external APIs |
| `chalk` | Colored terminal output |
| `fluent-ffmpeg` | Audio and video conversion |
| `jimp` | Image manipulation |
| `node-cache` | In-memory caching layer |
| `pino` | Fast structured logger |
| `sharp` | High-performance image processing |
| `ytdl-core` / `yt-search` | YouTube audio and video downloading |
| `libphonenumber-js` | Phone number parsing and validation |
| `node-fetch` | Fetch API polyfill for Node.js |

Full dependency list is in `package.json`.

---

## ❓ FAQ

**Q: The bot isn't responding to commands.**
> Check that the bot is running and in `public` mode. Try sending `.ping` — if there is no response, restart the bot. Confirm the prefix in your message matches `settings.js`.

**Q: How do I change the command prefix from `.` to something else?**
> Open `settings.js` and change `prefix: '.'` to your preferred character (e.g. `'!'`, `'/'`, `'#'`). Restart the bot. No other files need to be changed.

**Q: My session keeps getting deleted after a restart.**
> Make sure the `sessions/` folder is not excluded by `.gitignore` or your hosting panel's reset-on-deploy setting. The folder must persist between restarts.

**Q: Can the bot be added to groups?**
> Yes. Add the bot's WhatsApp number to any group. For admin-restricted commands (kick, mute, promote, etc.) you must also make the bot a group admin.

**Q: `.pair` says there is no storage available.**
> The server has insufficient free disk space for a new session. Free up disk space or upgrade your hosting plan, then try again.

**Q: How do I give someone trusted access without making them the owner?**
> Use `.sudo add @user` in chat. Sudo users can run owner-level commands. Remove them with `.sudo remove @user`.

**Q: How do I switch the bot to private mode?**
> Send `.mode private` (owner only). In private mode only the owner and sudo users can use commands. Switch back with `.mode public`.

---

## 🙏 Credits

| Name | Contribution |
|---|---|
| **NABEES TECH** | Creator and maintainer of Batman MD |
| **@whiskeysockets** | Maintained Baileys WhatsApp library fork |
| **@adiwajshing** | Original Baileys WhatsApp library |
| **TechGod143** | Pairing code implementation reference |
| **Dgxeon** | Pairing code implementation reference |

---

## ⚠️ Legal

- This project is **not affiliated with, authorized, maintained, sponsored, or endorsed by WhatsApp** or any of its affiliates or subsidiaries.
- This is independent, unofficial software. **Use at your own risk.**
- Do not use this bot to send bulk messages, spam, or for any illegal purposes.
- Using unofficial WhatsApp clients may result in account restrictions or bans. The developers accept no liability for any consequences.
- All use must comply with applicable local laws and WhatsApp's Terms of Service.

---

## 📜 License

```
MIT License

Copyright (c) 2024 NABEES TECH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

Made with dedication by **NABEES TECH**

*Batman MD — Dark, powerful, always watching.*

</div>
