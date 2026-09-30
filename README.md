# PronounceRight

Master English pronunciation with IPA. Plain HTML/CSS/JS, no build step.

- **Learn** – all 44 phonemes with example words, tips, and audio
- **Practice** – Listening, Symbol Recognition, Speaking Practice, Word Only Quiz
- **Stats** – level, XP, streak, mastered phonemes (saved in localStorage)

## Audio

No audio files are bundled. All sounds come from the browser's built-in speech synthesis (Web Speech API), which reads an example word for each phoneme. Speaking modes use the browser's speech recognition (Chrome / Safari; needs HTTPS + microphone permission).

If you have phoneme recordings you are licensed to use, drop them in `sounds/<id>.mp3` (ids from `phonemes.js`, e.g. `sounds/ae.mp3`) and they will play instead of TTS. Do not add clips extracted from YouTube or other copyrighted sources.

## Run locally

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy to GitHub Pages

```
git init && git add -A && git commit -m "PronounceRight"
gh repo create pronounceright --public --source=. --push
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
The site appears at `https://<user>.github.io/pronounceright/` in about a minute.

## Check

```
node test.js
```
