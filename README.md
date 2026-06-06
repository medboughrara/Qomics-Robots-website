<a href="https://bambot.org">
  <img width="1130" alt="Screenshot of bambot.org" src="https://github.com/user-attachments/assets/bcf347d7-5d76-4021-8a99-bb4515323fe0" />
</a>

<br/>
<br/>

<p align="center">
  <a href="https://discord.gg/Fq2gvSMyRJ"><img src="https://flat.badgen.net/static/chat/on%20discord" alt="Discord"></a>
  <a href="https://i.v2ex.co/1U6OSqswl.jpeg"><img src="https://flat.badgen.net/static/chat/on%20wechat?color=green" alt="WeChat"></a>
  <a href="https://x.com/tim_qian"><img src="https://flat.badgen.net/static/follow/on%20X?color=black" alt="X"></a>
  <a href="https://deepwiki.com/timqian/bambot"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

# [Bambot](https://bambot.org)

Play with open-source, low-cost AI robots 🤖

Bambot makes it easy to simulate, control, and build your own low-cost robots. The project integrates a 3D simulation environment, an AI-powered control interface, and direct WebUSB-based hardware communication.

---

## 🌟 Key Features

- **3D Robot Playground**: Interactive simulation using Three.js/React Three Fiber to visualize and test robot movements in the browser.
- **AI-Powered Controls**: Control the robot using natural language via an integrated LLM chat panel.
- **WebUSB Direct Control (`feetech.js`)**: Connect and send commands directly from Chrome/Edge to Feetech servos (STS/SCS series) without installing external drivers.
- **Low-Cost Hardware**: Standard designs combining the SO-100 arm and LeKiwi omni-directional base, costing ~ $300 in total.

---

## 📂 Project Structure

This repository is organized as a monorepo containing the following components:

- **[`website/`](file:///d:/bambot/website)**: A Next.js web application providing the interactive 3D playground, keyboard/AI control interfaces, and robot assembly steps.
- **[`feetech.js/`](file:///d:/bambot/feetech.js)**: A lightweight WebUSB SDK/library for controlling Feetech servos (like the STS3215) directly from the browser.
- **[`hardware/`](file:///d:/bambot/hardware)**: Bill of Materials (BOM), 3D printable STL/3MF models, and assembly resources.

---

## 🚀 Getting Started

### 1. Run the Web Interface Locally

To spin up the interactive website on your local machine:

```bash
cd website
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### 2. Using the Feetech JS SDK

You can use `feetech.js` in your own web applications to control servos over WebUSB:

```bash
cd feetech.js
npm install
```

```javascript
import { ScsServoSDK } from "feetech.js";
const scsServoSdk = new ScsServoSDK();

// Request USB device permission and connect
await scsServoSdk.connect();

// Read current servo position
const position = await scsServoSdk.readPosition(1);
console.log(`Servo 1 Position: ${position}`);
```

For more API details, refer to the [SDK Documentation](https://deepwiki.com/timqian/bambot/5.1-sdk-overview-and-api).

---

## 🛠️ Hardware & Assembly

For details on the 3D printed parts, electronic components, and full assembly instructions, check out the **[Hardware Guide](file:///d:/bambot/hardware/README.md)**.

---

## 📹 Demo Video

<a href="https://x.com/Tim_Qian/status/1901952877243122014">
  <img alt="Bambot, open source, low-cost humanoid ($300)" src="https://github.com/user-attachments/assets/bc9536e2-1fa6-4cb5-99f3-15a794bf09cf" width="600" style="height:auto;" />
</a>
