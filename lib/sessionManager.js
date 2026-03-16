/**
 * Session Manager for Batman MD Multi-Session System
 * Manages user bot sessions, storage limits, and process lifecycle
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

const SESSIONS_DIR = path.join(process.cwd(), 'sessions');
const SESSION_SIZE_ESTIMATE_MB = 8; // ~8MB per session estimate
const MIN_FREE_SPACE_MB = 200; // Keep at least 200MB free

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Track active child processes: number -> ChildProcess
const activeProcesses = new Map();

/**
 * Get available disk space in MB
 */
function getFreeDiskSpaceMB() {
    try {
        const output = execSync(`df -m "${process.cwd()}" | tail -1 | awk '{print $4}'`, {
            encoding: 'utf-8',
            timeout: 5000
        }).trim();
        const freeMB = parseInt(output, 10);
        return isNaN(freeMB) ? 500 : freeMB;
    } catch (err) {
        console.error('[SessionManager] Could not check disk space:', err.message);
        return 500; // default fallback
    }
}

/**
 * Calculate how many more sessions we can safely allow
 */
function getAvailableSlots() {
    const freeMB = getFreeDiskSpaceMB();
    const usableMB = Math.max(0, freeMB - MIN_FREE_SPACE_MB);
    return Math.floor(usableMB / SESSION_SIZE_ESTIMATE_MB);
}

/**
 * Get list of existing session numbers (excludes 'owner')
 */
function getExistingSessionNumbers() {
    try {
        return fs.readdirSync(SESSIONS_DIR).filter(entry => {
            const fullPath = path.join(SESSIONS_DIR, entry);
            return fs.statSync(fullPath).isDirectory() && entry !== 'owner';
        });
    } catch (err) {
        return [];
    }
}

/**
 * Check if a session for a given number already exists
 */
function sessionExists(number) {
    const sessionPath = path.join(SESSIONS_DIR, number);
    return fs.existsSync(sessionPath);
}

/**
 * Create a session folder for the given number.
 * Returns the session path.
 */
function createSessionFolder(number) {
    const sessionPath = path.join(SESSIONS_DIR, number);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }
    return sessionPath;
}

/**
 * Remove a session folder entirely
 */
function deleteSessionFolder(number) {
    const sessionPath = path.join(SESSIONS_DIR, number);
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
}

/**
 * Launch a user bot subprocess using index.js with a custom session folder.
 * Sets SESSION_NUMBER env var so the user bot knows which session to load.
 */
function launchUserBot(number) {
    if (activeProcesses.has(number)) {
        console.log(`[SessionManager] Bot for ${number} is already running`);
        return;
    }

    const botScript = path.join(process.cwd(), 'index.js');
    const sessionPath = path.join(SESSIONS_DIR, number);

    console.log(`[SessionManager] Launching bot for ${number}`);

    const child = spawn(process.execPath, [botScript], {
        env: {
            ...process.env,
            SESSION_NUMBER: number,
            SESSION_FOLDER: sessionPath
        },
        cwd: process.cwd(),
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
        console.log(`[Bot:${number}] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`[Bot:${number}] ERR: ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
        console.log(`[SessionManager] Bot for ${number} exited with code ${code}. Restarting in 10s...`);
        activeProcesses.delete(number);

        // Auto-restart after 10 seconds if session still exists
        setTimeout(() => {
            if (sessionExists(number)) {
                launchUserBot(number);
            }
        }, 10000);
    });

    child.on('error', (err) => {
        console.error(`[SessionManager] Failed to start bot for ${number}:`, err.message);
        activeProcesses.delete(number);
    });

    activeProcesses.set(number, child);
    return child;
}

/**
 * Kill a running user bot process
 */
function stopUserBot(number) {
    if (activeProcesses.has(number)) {
        try {
            activeProcesses.get(number).kill('SIGTERM');
        } catch (err) {
            console.error(`[SessionManager] Error stopping bot for ${number}:`, err.message);
        }
        activeProcesses.delete(number);
    }
}

/**
 * Restart all existing user sessions on manager bot startup
 */
function restoreExistingSessions() {
    const numbers = getExistingSessionNumbers();
    console.log(`[SessionManager] Restoring ${numbers.length} existing session(s)...`);
    for (const number of numbers) {
        const sessionPath = path.join(SESSIONS_DIR, number);
        const credsPath = path.join(sessionPath, 'creds.json');
        // Only start if creds.json exists (means user already paired)
        if (fs.existsSync(credsPath)) {
            setTimeout(() => launchUserBot(number), 3000);
        }
    }
}

module.exports = {
    SESSIONS_DIR,
    getFreeDiskSpaceMB,
    getAvailableSlots,
    getExistingSessionNumbers,
    sessionExists,
    createSessionFolder,
    deleteSessionFolder,
    launchUserBot,
    stopUserBot,
    restoreExistingSessions,
    activeProcesses
};
