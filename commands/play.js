// plugins/download/play.js

import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import yts from "yt-search";

const DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractVideoId(url) {
  if (!url) return null;
  let m = null;
  if (url.includes("youtube.com/shorts/") || url.includes("youtu.be/")) {
    m = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
  } else if (url.includes("youtube.com")) {
    m = /v=([a-zA-Z0-9\-_]{11})/.exec(url);
  } else {
    m = /[a-zA-Z0-9\-_]{11}/.exec(url);
  }
  return m ? m[1] : null;
}

async function scrapeYtmp3(youtubeUrl, format = "mp3") {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const lowerFormat = format.toLowerCase();
  if (!["mp3", "mp4"].includes(lowerFormat)) throw new Error("Invalid format");

  const headers = {
    "User-Agent": DEFAULT_UA,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://id.ytmp3.mobi",
    "Referer": "https://id.ytmp3.mobi/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site"
  };

  const initRes = await fetch(`https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers });
  if (!initRes.ok) throw new Error(`Init failed: ${initRes.status}`);
  const initJson = await initRes.json();
  if (initJson.error > 0) throw new Error(`Init error: ${initJson.error}`);

  let convertUrl = `${initJson.convertURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
  let convertJson;
  while (true) {
    const r = await fetch(convertUrl, { headers });
    if (!r.ok) throw new Error(`Convert failed: ${r.status}`);
    convertJson = await r.json();
    if (convertJson.error > 0) throw new Error(`Convert error: ${convertJson.error}`);
    if (convertJson.redirect > 0 && convertJson.redirectURL) {
      convertUrl = `${convertJson.redirectURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
      continue;
    }
    break;
  }

  const progressUrl = convertJson.progressURL;
  const downloadUrl = convertJson.downloadURL;
  let title = convertJson.title || "";
  if (!progressUrl) throw new Error("No progress URL");

  let progress = 0, poll = 0;
  while (progress < 3 && poll < 60) {
    await new Promise((r) => setTimeout(r, 1000));
    poll++;
    const p = await fetch(progressUrl, { headers });
    if (!p.ok) throw new Error(`Progress failed: ${p.status}`);
    const pj = await p.json();
    if (pj.error > 0) throw new Error(`Progress error: ${pj.error}`);
    progress = pj.progress;
    if (pj.title) title = pj.title;
  }
  if (progress < 3) throw new Error("Conversion timeout");

  return { status: "success", videoId, title, format: lowerFormat, downloadUrl };
}

async function toAudio(buffer, ext) {
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const inputPath = path.join(tempDir, `in_${Date.now()}.${ext}`);
  const outputPath = path.join(tempDir, `out_${Date.now()}.mp3`);
  fs.writeFileSync(inputPath, buffer);
  await new Promise((resolve, reject) => {
    exec(`ffmpeg -i "${inputPath}" -acodec libmp3lame -ab 192k "${outputPath}" -y`, (err) => {
      if (err) reject(err); else resolve();
    });
  });
  const result = fs.readFileSync(outputPath);
  try { fs.unlinkSync(inputPath); } catch {}
  try { fs.unlinkSync(outputPath); } catch {}
  return result;
}

async function buildThumb(thumbnailUrl, videoId) {
  const sharp = (await import("sharp")).default;

  const candidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    thumbnailUrl
  ].filter(Boolean);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) continue;

      return await sharp(buf)
        .resize(300, 300, { fit: "cover" })
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer();
    } catch {}
  }
  return Buffer.alloc(0);
}

async function sendCatalogAudio(conn, m, audioBuffer, thumbBuffer, meta) {
  const sock = conn || global.feb || global.sock || global.conn;
  if (!sock) throw new Error("No socket");

  const { prepareWAMessageMedia } = await import("@whiskeysockets/baileys");

  const uploaded = await prepareWAMessageMedia(
    { image: thumbBuffer },
    { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
  );
  const media = uploaded.imageMessage;

  const thumbDirectPath = media.directPath;
  const thumbSha256 = media.fileSha256;
  const thumbEncSha256 = media.fileEncSha256;
  const thumbMediaKey = media.mediaKey;
  const thumbMediaKeyTimestamp = media.mediaKeyTimestamp;
  const thumbHeight = media.height;
  const thumbWidth = media.width;
  const thumbJpeg = media.jpegThumbnail;

  const uploadedAudio = await prepareWAMessageMedia(
    { audio: audioBuffer, mimetype: "audio/mpeg" },
    { upload: sock.waUploadToServer }
  );
  const audioMsg = uploadedAudio.audioMessage;

  const audioData = {
    url: audioMsg.url,
    mimetype: "audio/mpeg",
    fileSha256: audioMsg.fileSha256,
    fileLength: audioMsg.fileLength,
    seconds: audioMsg.seconds || meta.seconds || 0,
    ptt: false,
    mediaKey: audioMsg.mediaKey,
    fileEncSha256: audioMsg.fileEncSha256,
    directPath: audioMsg.directPath,
    mediaKeyTimestamp: audioMsg.mediaKeyTimestamp,

    contextInfo: {
      stanzaId: m.key?.id || "",
      participant: "0@s.whatsapp.net",

      thumbnailDirectPath: thumbDirectPath,
      thumbnailSha256: thumbSha256,
      thumbnailEncSha256: thumbEncSha256,
      mediaKey: thumbMediaKey,
      mediaKeyTimestamp: thumbMediaKeyTimestamp,
      thumbnailHeight: thumbHeight,
      thumbnailWidth: thumbWidth,
      jpegThumbnail: thumbJpeg || thumbBuffer,

      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: global.connl,
        newsletterName: global.connlName || global.botname,
        serverMessageId: 1
      },

      quotedMessage: {
        orderMessage: {
          thumbnail: (thumbJpeg || thumbBuffer).toString("base64"),
          itemCount: 1,
          status: 0,
          surface: 0,
          message: meta.title,
          orderTitle: "🎵 PLAY AUDIO",
          orderId: "",
          token: "BATMAN-MD",
          totalAmount1000: 0,
          totalCurrencyCode: "USD",
          messageVersion: 1,
          sellerJid: "0@s.whatsapp.net"
        }
      },

      remoteJid: "status@broadcast",
      expiration: 7776000,
      disappearingMode: { initiator: 0 }
    }
  };

  await sock.relayMessage(
    m.chat,
    { audioMessage: audioData },
    { messageId: "SONG-" + Date.now() }
  );
}

let handler = async (m, { conn, args }) => {
  const prefix = m.prefix || global.prefix || ".";

  try {
    const searchQuery = args.join(" ").trim();

    if (!searchQuery) {
      return m.reply(
`🎵 Song Downloader

Usage: ${prefix}song <song name or YouTube link>
Example: ${prefix}song Alan Walker - Faded

${global.footer}`
      );
    }

    let video;
    if (searchQuery.includes("youtube.com") || searchQuery.includes("youtu.be")) {
      video = { url: searchQuery };
    } else {
      const search = await yts(searchQuery);
      if (!search || !search.videos.length) {
        await m.react("❌");
        return m.reply("No results found.");
      }
      video = search.videos[0];
    }

    await m.react("🎵");

    const result = await scrapeYtmp3(video.url, "mp3");
    if (result.status !== "success") throw new Error(result.message || "scrape failed");

    const audioResponse = await fetch(result.downloadUrl, { headers: { "User-Agent": DEFAULT_UA } });
    if (!audioResponse.ok) throw new Error(`Audio fetch failed: ${audioResponse.status}`);

    let audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    if (!audioBuffer?.length) throw new Error("Empty audio");

    let finalBuffer = audioBuffer;
    const id3 = audioBuffer.toString("ascii", 0, 3);
    const isMp3 = id3 === "ID3" || (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0);
    if (!isMp3) {
      try { finalBuffer = await toAudio(audioBuffer, "m4a"); } catch {}
    }

    await m.react("📥");

    const videoId = result.videoId || extractVideoId(video.url) || extractVideoId(video.image || "");
    const title = result.title || video.title || "Song";
    const thumbnailUrl = video.thumbnail || video.image || null;
    const author = video.author?.name || "YouTube";
    const duration = video.timestamp || "Song";

    const thumbBuffer = await buildThumb(thumbnailUrl, videoId);

    await sendCatalogAudio(conn, m, finalBuffer, thumbBuffer, {
      title,
      author,
      duration,
      seconds: video.seconds || 0
    });

    await m.react("✅");

  } catch (error) {
    console.error("[Song] Error:", error.message);
    await m.react("❌");
    await m.reply(`Failed: ${error.message}`);
  }
};

handler.command = ["song", "play", "music", "yta"];
handler.help = ["song", "play"];
handler.tags = ["download"];

export default handler;
