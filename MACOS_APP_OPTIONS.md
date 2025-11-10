# 🍎 macOS App Options for Bucket

**Current Stack**: React + TinyBase + WebSocket Sync
**Backend**: Node.js sync server (sync-db/server.js)

---

## 📊 Options Comparison

| Option | Bundle Size | Native Feel | Dev Effort | Performance | Recommendation |
|--------|-------------|-------------|------------|-------------|----------------|
| **Tauri** | 🟢 ~3-5MB | 🟢 Native | 🟡 Medium | 🟢 Excellent | ⭐ **BEST** |
| **Electron** | 🔴 ~100MB+ | 🟡 Good | 🟢 Easy | 🟡 Good | ❌ Avoid |
| **PWA** | 🟢 Web | 🟡 Web-like | 🟢 Trivial | 🟢 Great | ✅ **EASIEST** |
| **React Native macOS** | 🟡 ~20MB | 🟢 Native | 🔴 Hard | 🟢 Great | ❌ Complex |
| **SwiftUI + WebView** | 🟢 ~5MB | 🟢 Native | 🟡 Medium | 🟢 Great | ✅ Good |

---

## 🏆 Recommended: Tauri (Modern Electron Alternative)

**Why Tauri?**
- ✅ **Tiny Bundle**: 3-5MB vs Electron's 100MB+
- ✅ **Uses System WebView**: No Chromium bundled
- ✅ **Native Performance**: Rust backend
- ✅ **Your React Code Works**: Zero changes needed!
- ✅ **Cross-Platform**: macOS + Windows + Linux from same codebase
- ✅ **Auto-Updates**: Built-in
- ✅ **Native Menus**: macOS menu bar integration

### Implementation Plan

**1. Install Tauri**
```bash
cd /Users/sn/Projects/bucket

# Install Tauri CLI
pnpm add -D @tauri-apps/cli@latest
pnpm add @tauri-apps/api@latest

# Initialize Tauri
pnpm tauri init
```

**2. Configuration Answers**
```
What is your app name? Bucket
What should the window title be? Bucket
Where are your web assets? ../dist
What is the URL of your dev server? http://localhost:4000
What is your frontend dev command? pnpm run dev
What is your frontend build command? pnpm build
```

**3. Project Structure**
```
bucket/
├── src/                    # Your existing React app (unchanged!)
├── src-tauri/             # Tauri Rust backend
│   ├── src/
│   │   └── main.rs        # Window config, menus, tray icon
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # App config
│   └── icons/             # macOS icons
├── dist/                  # Built web assets
└── package.json
```

**4. Add NPM Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

**5. Development Workflow**
```bash
# Dev mode (hot reload!)
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

**6. Output**
- `.dmg` installer for macOS
- `.app` bundle for App Store (with additional steps)
- Size: ~3-5MB total!

### Tauri Configuration Example

**src-tauri/tauri.conf.json**:
```json
{
  "build": {
    "beforeDevCommand": "pnpm run dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:4000",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Bucket",
    "version": "0.0.1"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "window": {
        "all": false,
        "close": true,
        "hide": true,
        "show": true,
        "maximize": true,
        "minimize": true,
        "unmaximize": true,
        "unminimize": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.bucket.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      }
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "Bucket",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

### Native Features You Can Add

**Menu Bar App** (src-tauri/src/main.rs):
```rust
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

fn main() {
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let close = CustomMenuItem::new("close".to_string(), "Close");

  let submenu = Submenu::new("File", Menu::new()
    .add_item(close)
    .add_native_item(MenuItem::Separator)
    .add_item(quit));

  let menu = Menu::new()
    .add_submenu(submenu);

  tauri::Builder::default()
    .menu(menu)
    .on_menu_event(|event| {
      match event.menu_item_id() {
        "quit" => {
          std::process::exit(0);
        }
        "close" => {
          event.window().close().unwrap();
        }
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

**System Tray Icon**:
```rust
use tauri::{SystemTray, SystemTrayMenu, SystemTrayEvent};

let tray_menu = SystemTrayMenu::new()
  .add_item(CustomMenuItem::new("show", "Show Bucket"))
  .add_item(CustomMenuItem::new("hide", "Hide"))
  .add_item(CustomMenuItem::new("quit", "Quit"));

let system_tray = SystemTray::new().with_menu(tray_menu);

tauri::Builder::default()
  .system_tray(system_tray)
  .on_system_tray_event(|app, event| match event {
    SystemTrayEvent::LeftClick { .. } => {
      let window = app.get_window("main").unwrap();
      window.show().unwrap();
      window.set_focus().unwrap();
    }
    _ => {}
  })
  .run(tauri::generate_context!())
  .expect("error while running tauri application");
```

### Benefits for Bucket

**1. Offline-First Works Perfectly**
- TinyBase localStorage persistence works
- WebSocket reconnects automatically
- No code changes needed!

**2. Better than Web**
- Native notifications
- System tray integration
- Auto-launch on startup
- CMD+Tab app switching
- macOS menu bar

**3. Distribution**
- `.dmg` installer (drag to Applications)
- Auto-updater built-in
- No web server needed
- Works offline completely

---

## 🌐 Alternative: PWA (Progressive Web App)

**Simplest Option - Already 90% Done!**

You already have PWA setup (`vite-plugin-pwa`). Just need to make it installable on macOS.

### What You Have
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'Bucket',
        short_name: 'Bucket',
        description: 'Track progress with 0-100% bars',
        theme_color: '#000000',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

### How Users Install (macOS Safari)

1. Open https://bucket.app in Safari
2. Click Share → Add to Dock
3. App icon appears in Dock
4. Launches like native app!

### Benefits
- ✅ **Zero Additional Work**: Already done!
- ✅ **Cross-Platform**: macOS, iOS, Windows, Linux
- ✅ **Auto-Updates**: Workbox handles it
- ✅ **Offline**: Service worker caches everything

### Limitations
- ❌ No native menu bar
- ❌ No system tray
- ❌ Requires Safari/Chrome to install
- ❌ Less "native" feel

---

## 💎 Option 3: SwiftUI Wrapper (Most Native)

**For Maximum macOS Integration**

### Concept
```swift
// ContentView.swift
import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WebView(url: URL(string: "http://localhost:4000")!)
            .frame(minWidth: 800, minHeight: 600)
    }
}

struct WebView: NSViewRepresentable {
    let url: URL

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}
```

### Benefits
- ✅ **100% Native**: True macOS app
- ✅ **SwiftUI**: Modern Apple UI framework
- ✅ **Full macOS APIs**: Notifications, share sheet, etc.

### Drawbacks
- ❌ **Swift Required**: Need to learn Swift
- ❌ **More Code**: Wrapper + bridge to React
- ❌ **macOS Only**: Separate apps for Windows/Linux

---

## ❌ NOT Recommended: Electron

**Why Not?**
- 🔴 **100MB+ Bundle**: Bundles entire Chromium
- 🔴 **Memory Hog**: ~200MB RAM minimum
- 🔴 **Slow Startup**: ~2-3 seconds
- 🔴 **Outdated**: Tauri is modern replacement

**Only Use If**:
- You need Node.js APIs in renderer process
- You have existing Electron expertise
- You need legacy Chromium compatibility

---

## 🎯 Recommendation Matrix

### For You (Based on Current Stack)

**Priority 1: PWA (This Week)** ✅
```bash
# Already done! Just deploy and test:
pnpm build
open dist/index.html  # Test locally
# Deploy to production
# Install from Safari
```

**Priority 2: Tauri (Next Month)** ⭐
```bash
# 2-3 hours of work:
pnpm add -D @tauri-apps/cli@latest
pnpm tauri init
pnpm tauri:dev
pnpm tauri:build
```

**Benefits of Both**:
- PWA: Immediate availability, zero work
- Tauri: Better native feel, smaller bundle, distribution

**Skip**:
- Electron (too heavy)
- React Native macOS (too complex)
- SwiftUI (unless you want to learn Swift)

---

## 🚀 Quick Start: Add Tauri to Bucket

**Step 1: Prerequisites**
```bash
# Install Rust (if not already)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify
rustc --version
cargo --version
```

**Step 2: Add Tauri**
```bash
cd /Users/sn/Projects/bucket

pnpm add -D @tauri-apps/cli@latest
pnpm add @tauri-apps/api@latest

pnpm tauri init
# Answer prompts (see configuration above)
```

**Step 3: Update package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

**Step 4: Test**
```bash
# Dev mode
pnpm tauri:dev

# Should open native macOS window with your React app!
```

**Step 5: Build for Distribution**
```bash
pnpm tauri:build

# Output: src-tauri/target/release/bundle/
# - Bucket.app (macOS app bundle)
# - Bucket.dmg (installer)
```

**Step 6: Distribute**
- Share `.dmg` file
- Users drag to Applications folder
- Done! ~3-5MB total

---

## 📱 Bonus: iOS App (Future)

Tauri is working on mobile support. When ready:
```bash
pnpm tauri ios init
pnpm tauri ios dev
pnpm tauri ios build
```

Same React codebase → iOS app!

---

## 🎨 Design Considerations

### macOS-Specific Features to Add

**1. Native Menu Bar**
```
Bucket
  About Bucket
  ──────────────
  Preferences...    ⌘,
  ──────────────
  Hide Bucket      ⌘H
  Hide Others      ⌥⌘H
  Show All
  ──────────────
  Quit Bucket      ⌘Q

File
  New List         ⌘N
  New Task         ⌘T
  ──────────────
  Close Window     ⌘W

Edit
  Undo             ⌘Z
  Redo             ⇧⌘Z
  ──────────────
  Cut              ⌘X
  Copy             ⌘C
  Paste            ⌘V
  ──────────────
  Select All       ⌘A

View
  Cemetery         ⌘⇧C
  Export Data      ⌘E
  ──────────────
  Sync Now         ⌘R

Window
  Minimize         ⌘M
  Zoom
  ──────────────
  Bring All to Front
```

**2. System Tray Integration**
```
[🪣]  (icon in menu bar)
  ├─ Show Bucket
  ├─ Quick Add Task
  ├─ ───────────
  ├─ Sync Status: ● Connected
  ├─ Last Sync: 2 minutes ago
  ├─ ───────────
  └─ Quit
```

**3. Touch Bar Support** (MacBook Pro)
```
[New List] [New Task] [Cemetery] [Sync] [Export]
```

**4. Notifications**
```swift
// When task hits 100%
let notification = UNMutableNotificationContent()
notification.title = "Task Completed!"
notification.body = "Build production-ready app"
notification.sound = .default
```

---

## 💰 Cost Analysis

| Option | Development | Distribution | Updates |
|--------|-------------|--------------|---------|
| **PWA** | Free | Free (hosting) | Free |
| **Tauri** | Free | Free | Free |
| **Mac App Store** | $99/year | Apple takes 30% | Free |
| **Electron** | Free | Free | Free |

**Recommendation**: Start with PWA + Tauri, skip App Store unless needed.

---

## 🎯 Final Recommendation

### Week 1: PWA ✅
**Already done!** Just deploy and install from Safari.
- Effort: 0 hours (already implemented)
- Users: Can install immediately

### Week 2-3: Tauri ⭐
**Best native experience**
- Effort: 2-3 hours
- Output: `.dmg` installer
- Bundle: ~3-5MB
- Distribution: GitHub Releases

### Skip Entirely:
- ❌ Electron (too heavy)
- ❌ React Native macOS (too complex)
- ❌ Mac App Store (unless you want to pay $99/year)

---

## 🚦 Implementation Checklist

### Phase 1: PWA (Already Done)
- [x] vite-plugin-pwa configured
- [x] Service worker generated
- [x] Manifest.json created
- [x] Icons added
- [ ] Deploy to production
- [ ] Test installation from Safari

### Phase 2: Tauri
- [ ] Install Rust
- [ ] Add Tauri dependencies
- [ ] Initialize Tauri project
- [ ] Configure tauri.conf.json
- [ ] Add macOS icons
- [ ] Test dev mode
- [ ] Build production bundle
- [ ] Test .dmg installer
- [ ] Setup auto-updates
- [ ] Distribute via GitHub Releases

---

**Need help implementing Tauri? Let me know and I'll create the complete setup!**
