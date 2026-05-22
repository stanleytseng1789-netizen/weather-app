# Android phone setup

This weather app is now prepared as a mobile-friendly PWA.

## Fast local test on Sony Xperia 10 IV

1. Keep the computer and phone on the same Wi-Fi.
2. In PowerShell, run:

```powershell
cd C:\Users\st112\Documents\Codex\2026-05-21\app
.\start-mobile-server.ps1
```

3. The script prints one or more URLs like:

```text
http://192.168.1.25:4173/
```

4. Open that URL in Chrome on the Android phone.

This is best for quick testing. Because it uses normal HTTP on the local network, Chrome may not allow full offline PWA installation.

## Install-like app on Android

For a real home-screen app experience, host this folder on an HTTPS service such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages. Then:

1. Open the HTTPS URL in Chrome on the phone.
2. Tap the three-dot menu.
3. Choose "Add to Home screen" or "Install app".

After that, the app opens in standalone mode from the phone home screen.
