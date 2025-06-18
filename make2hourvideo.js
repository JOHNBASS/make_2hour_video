// make2hourvideo.js
// 用 Node.js 自動下載範例音樂與影片，合成2小時影片，並產生 YouTube 標題/說明/tag 檔案

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

const INTRO_IMAGE = 'intro.png';
const VIDEO_FILE = 'cat_video.mp4';
const AUDIO_FILE = 'piano_audio.mp3';
const OUTPUT_VIDEO = 'output_8h.mp4';
const YOUTUBE_META = 'youtube_meta.txt';
const TARGET_SECONDS = 8 * 60 * 60; // 8小時

// 下載檔案
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      resolve();
      return;
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error('Download failed: ' + url));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

// 取得媒體長度（秒）
function getMediaDuration(file) {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`;
  const output = execSync(cmd).toString().trim();
  return Math.ceil(parseFloat(output));
}

// 重複串接音樂/影片
function concatMedia(input, output, repeat) {
  // 產生 list.txt
  const listFile = 'list.txt';
  let listContent = '';
  for (let i = 0; i < repeat; i++) {
    listContent += `file '${path.resolve(input)}'\n`;
  }
  fs.writeFileSync(listFile, listContent);
  // 串接
  execSync(`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy "${output}"`);
  fs.unlinkSync(listFile);
}

// 裁切媒體
function trimMedia(input, output, duration) {
  execSync(`ffmpeg -y -i "${input}" -t ${duration} -c copy "${output}"`);
}

// 合成音樂與影片
function muxVideoAudio(video, audio, output) {
  execSync(`ffmpeg -y -i "${video}" -i "${audio}" -c:v copy -c:a aac -shortest "${output}"`);
}

// 產生 YouTube meta 檔案
function writeYoutubeMeta() {
  const title = '【100%無廣告】貓咪陪伴的鋼琴放鬆音樂 🐾 2小時助眠旋律 | 靜心冥想・睡前減壓・Alpha波・消除緊繃・淨化音樂';
  const desc = `這部影片提供 2 小時高品質無人聲的放鬆鋼琴音樂，結合可愛貓咪的陪伴旋律，幫助您在夜晚入睡、冥想或祈禱時達到平靜放鬆的狀態。

✨ 適合用於：
- 睡前舒壓、快速入眠
- 冥想靜坐、靈修祈禱
- 焦慮舒緩、自我放鬆
- 工作、閱讀、專注時的背景音

✅ 使用 YouTube 網頁內建的「循環播放」功能
1.在 YouTube 上打開你想要循環播放的音樂影片。
2.右鍵點擊影片畫面（或觸控板兩指點按）。
3.在選單中點選 「循環播放」（Loop）。
4.這樣影片播放完後就會自動重播，無需登入帳號。

🔁 若你點兩下沒看到「循環播放」，再嘗試點兩次（即第二層右鍵選單）。

✅ 請按讚、訂閱並分享給需要放鬆的朋友
#助眠音樂 #放鬆鋼琴 #貓咪音樂 #背景音樂 #冥想音樂 #靜心音樂
#身體恢復#身體療癒
`;
  const tags = `cat music,relaxing piano,sleep music,cute kitten relaxing,calm piano background,peaceful music,bedtime piano,ambient sounds,meditation music,piano for sleep,cat companion music,stress relief music,deep sleep aid,fluffy cat chill,kitten ASMR,靜心音樂,貓咪鋼琴,助眠音樂,放鬆背景音,猫咪音乐,deep sleep,calm background music,peaceful piano music,ambient sleep sounds,study music,healing music,yoga background,助眠钢琴,静心冥想音乐`;
  fs.writeFileSync(YOUTUBE_META, `標題:\n${title}\n\n說明:\n${desc}\n\ntags:\n${tags}\n`);
}

// 主流程
async function main() {
  // console.log('下載範例影片與音樂...');
  // await downloadFile(VIDEO_URL, VIDEO_FILE);
  // await downloadFile(AUDIO_URL, AUDIO_FILE);

  // 產生片頭 10 秒 intro_10s.mp4
  // INTRO_IMAGE 已提升至檔案最上方
  const INTRO_VIDEO = 'intro_10s.mp4';
  if (!fs.existsSync(INTRO_VIDEO)) {
    execSync(`ffmpeg -y -loop 1 -i "${INTRO_IMAGE}" -c:v libx264 -t 10 -pix_fmt yuv420p -vf scale=1280:720 "${INTRO_VIDEO}"`);
  }

  // 串接 intro_10s.mp4 + VIDEO_FILE 成 video_with_intro.mp4
  const VIDEO_WITH_INTRO = 'video_with_intro.mp4';
  const listFileIntro = 'list_intro.txt';
  fs.writeFileSync(listFileIntro, `file '${path.resolve(INTRO_VIDEO)}'\nfile '${path.resolve(VIDEO_FILE)}'\n`);
  execSync(`ffmpeg -y -f concat -safe 0 -i ${listFileIntro} -c copy "${VIDEO_WITH_INTRO}"`);
  fs.unlinkSync(listFileIntro);

  // 後續流程都用 video_with_intro.mp4 當作影片來源
  const VIDEO_SOURCE = VIDEO_WITH_INTRO;

  console.log('計算音樂與影片長度...');
  const audioLen = getMediaDuration(AUDIO_FILE);
  const videoLen = getMediaDuration(VIDEO_SOURCE);

  // 計算音樂重複次數
  const audioRepeat = Math.ceil(TARGET_SECONDS / audioLen);
  const audioConcat = 'audio_long.mp3';
  concatMedia(AUDIO_FILE, audioConcat, audioRepeat);

  // 裁切音樂到2小時
  const audioFinal = 'audio_2h.mp3';
  trimMedia(audioConcat, audioFinal, TARGET_SECONDS);
  fs.unlinkSync(audioConcat);

  // 計算影片重複次數
  const videoRepeat = Math.ceil(TARGET_SECONDS / videoLen);
  const videoConcat = 'video_long.mp4';
  concatMedia(VIDEO_SOURCE, videoConcat, videoRepeat);

  // 裁切影片到2小時
  const videoFinal = 'video_2h.mp4';
  trimMedia(videoConcat, videoFinal, TARGET_SECONDS);
  fs.unlinkSync(videoConcat);

  // 合成影片與音樂
  console.log('合成影片與音樂...');
  muxVideoAudio(videoFinal, audioFinal, OUTPUT_VIDEO);

  // 清理
  fs.unlinkSync(videoFinal);
  fs.unlinkSync(audioFinal);

  // 產生 YouTube meta
  writeYoutubeMeta();

  console.log('完成！已產生影片:', OUTPUT_VIDEO, '與說明檔:', YOUTUBE_META);
}

main().catch(err => {
  console.error('發生錯誤:', err);
  process.exit(1);
});
