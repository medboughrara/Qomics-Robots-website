# Hardware Guide & BOM

> Join our community to get updates and support:
> <a href="https://discord.gg/Fq2gvSMyRJ"><img src="https://badgen.net/static/chat/on%20discord" alt="Discord"></a>
> <a href="https://i.v2ex.co/1U6OSqswl.jpeg"><img src="https://badgen.net/static/chat/on%20wechat?color=green" alt="WeChat"></a>
> <a href="https://x.com/tim_qian"><img src="https://badgen.net/static/follow/on%20X?color=black" alt="X"></a>

This folder contains resources for sourcing and building the Bambot hardware.

---

## 📐 3D Printed Parts & Assembly

### Interactive 3D Model on TinkerCAD
Explore Bambot's parts and assembly process in an interactive 3D environment:
<a align="center" href="https://www.tinkercad.com/things/ibgLfMl1NYQ-bambot-v0?sharecode=G9wKm5paH5_7YgA9Ykcv6GNS6HnqqBd3j6XwO5-DSlo"><img width="1254" alt="Bambot 3D Printed Parts and Assembly" src="https://github.com/user-attachments/assets/461102e7-2507-42bd-9d0a-aed78d18ca40" /></a>

### Printable 3D Models
Download the 3D printable STL and 3MF files directly from the GitHub releases:
👉 [Download Printable Files](https://github.com/timqian/bambot/releases)

---

## 🔌 Electronic Components & BOM

Bambot is designed to be highly affordable. The build is roughly composed of **1 [SO-100 Arm](https://github.com/TheRobotStudio/SO-ARM100/blob/main/README.md)** + **1 [LeKiwi Omnidirectional Base](https://github.com/SIGRobotics-UIUC/LeKiwi/blob/main/BOM.md)** plus connecting wires.

### Parts List (For one Bambot)

| Part | Amount | Unit Cost (US) | Buy Link (US) | Unit Cost (EU) | Buy Link (EU) | Unit Cost (CN) | Buy Link (CN) |
|---|---|---|---|---|---|---|---|
| STS3215 Servo (12V version)<sup>[1](#footnote1)</sup> | 15 | $15 | [Alibaba](https://www.alibaba.com/product-detail/6PCS-7-4V-STS3215-Servos-for_1600523509006.html) | 13€ | [Alibaba](https://www.alibaba.com/product-detail/6PCS-7-4V-STS3215-Servos-for_1600523509006.html) | ￥99/115 | [TaoBao](https://item.taobao.com/item.htm?id=712179366565&skuId=5268252241438) |
| Motor Control Board | 1 | $11 | [Amazon](https://www.amazon.com/Waveshare-Integrates-Control-Circuit-Supports/dp/B0CTMM4LWK/) | 12€ | [Amazon](https://www.amazon.fr/-/en/dp/B0CJ6TP3TP/)| ￥27 | [TaoBao](https://detail.tmall.com/item.htm?id=738817173460&skuId=5096283384143) |
| 4" Omni wheels | 3 | $9.99 | [VEX Robotics](https://www.vexrobotics.com/omni-wheels.html?srsltid=AfmBOorWdWT-FIiWSAbicYWSxqYr-d5X3CJSGxMkO33WO0thwlTn4DQu) | €24.5 | [RobotShop](https://eu.robotshop.com/products/100mm-omnidirectional-wheel-brass-bearing-rollers) | ¥28 | [TaoBao 1](https://e.tb.cn/h.6ZOL1twp9HlvEue?tk=nxvYeJUknqq) (80mm, 6mm version) |
| Assorted Screw Set (M2, M3, M4) | 1 | $14.99 | [Amazon](https://www.amazon.com/Button-Socket-Washers-Assortment-Machine/dp/B0BMQGJP3F) | €23.5 | [Amazon](https://www.amazon.fr/Cylindrique-Inoxydable-M2-Socket-Assortiment/dp/B09Y8WYFWD/) | ¥20 | [TaoBao](https://e.tb.cn/h.6gUXgJbEk9Z5mbb?tk=MKOuezal6rB) |
| Long 5264 wires | 2 | - | [TODO]() | - | [TODO]() | ¥20 | [TaoBao](https://e.tb.cn/h.6ZvsvUU7wlxTIqu?tk=mz7PeJUloea) (3P-1000mm & 3P-400mm, and connector) |
| Type-C to DC cable (12V/5V) | 1 | - | [TODO]() | - | [TODO]() | ¥20 | [TaoBao 12V](https://e.tb.cn/h.6ZvuOW01EmvvHq1?tk=nzvFeJUnyuB), [TaoBao 5V](https://item.taobao.com/item.htm?id=888084290249) |
| **Total** | | **~$300** | | **~€300** | | **~￥2000** | |

### Extra Parts for Teleoperation
- STS3215 Servo: 12
- Motor Control Board: 1
- 1000 mm 5264 wire: 2
- Type-C to DC wire: 1
- 3D-printed body parts of Bambot
- An extra PC

*Note: Teleoperation support using Joy-Cons is coming soon.*

---

## 🛠️ Required Tools
- 20000mAh Power Bank (supporting USB-C PD)
- MacBook + iPhone OR PC + External Camera
- Hex screwdrivers

---

## 🚀 Build and Play
Follow the guidelines and codebase at [lerobot-bambot](https://github.com/timqian/lerobot-bambot) to setup your software controls and run reinforcement learning models on Bambot!

---

### Footnotes
<a name="footnote1">1:</a> The STS3215 servo is available in 7.4V and 12V versions. We highly recommend using the **12V version** which provides a stall torque of 30kg.cm. The 7.4V version can be used but offers less torque (~16.5kg.cm) and requires a battery instead of standard USB-C PD power.
