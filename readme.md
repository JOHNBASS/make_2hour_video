# 2小時睡眠音樂影片自動產生腳本

## 1. 安裝需求

- Node.js（建議 v14 以上）
- ffmpeg（影音處理工具，macOS 可用 Homebrew 安裝：`brew install ffmpeg`）

## 2. 執行方式

在終端機執行：

```bash
node make2hourvideo.js
```

## 3. 更換自己的音樂與影片

- 將你自己的音樂檔案（mp3）命名為 `piano_audio.mp3`，放在本目錄下。
- 將你自己的影片檔案（mp4）命名為 `cat_video.mp4`，放在本目錄下。
- 重新執行腳本即可自動產生新影片。

## 4. 產出檔案說明

- `output_2h.mp4`：合成後的2小時（或更長）影片，可直接上傳 YouTube。
- `youtube_meta.txt`：YouTube 標題、說明、tag，可直接複製貼上。

## 5. 其他說明

- 如需調整影片長度，請修改 `make2hourvideo.js` 內的 `TARGET_SECONDS` 參數（單位：秒）。
- 預設會自動下載範例音樂與影片，若目錄下已有同名檔案則不會重複下載。
- 若遇到 ffmpeg 未安裝，請先安裝後再執行腳本。

---
