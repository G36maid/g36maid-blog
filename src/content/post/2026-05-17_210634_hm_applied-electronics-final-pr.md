---
title: "Applied Electronics Final Project: Size Classification"
description: "The system is designed to automatically classify objects by size as they roll down a slope under gravity and route them to the appropriat…"
pubDate: 2026-05-17 21:06:34 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1779023194
---

## 1. System Overview

The system is designed to automatically classify objects by size as they roll down a slope under gravity and route them to the appropriate output channel.

### 1.1 Main Components

1. **Objects:** 2 different sizes (Small / Large).
2. **Slope:** A ⅄-shape slope.
3. **Sensors:** Installed along the path to detect object size.
4. **Gate Mechanism:** Motor-driven gate.
5. **Electronic Circuit:** Integrates components for detection, logic, and actuation.

### 1.2 Control Logic & Routing

* **Small Object Detected:** The circuit actuates the motor to **open** the gate $\rightarrow$ Object passes through **Channel 1**.
* **Large Object Detected:** The gate remains **closed** (or actuated to block Channel 1) $\rightarrow$ Object is directed to **Channel 2**.

### 1.3 Design Requirements

* Reliable object size classification.
* Correct gate actuation.
* Proper synchronization between object detection and gate control to ensure accurate routing.

> **⚠️ CRITICAL CONSTRAINT**
> A microcontroller (e.g., Arduino, Raspberry Pi, ESP32) is allowed **ONLY to control the motor**.
> Other functions, including **signal processing** and **decision logic**, are **PROHIBITED** on the microcontroller (these must be implemented via pure analog/digital electronic circuits).

---

## 2. Grading Rubrics

### 2.1 Physical Circuit (40%)

* System works properly according to the requirements.
* Uses as **few circuit modules** as possible.
* Spends the **cheapest budget**.

### 2.2 Presentation and Q&A (40%)

* **Content:** Reports system design, diagram, circuit design, circuit analysis, and budget.
* **Delivery:** Clear presentation (Focus on clarity, NOT fancy visuals).
* **Q&A:** Clear and reasonable responses according to questions.

### 2.3 Report (20%)

* **Content:** Includes system design, diagram, circuit design, circuit analysis, and budget.
* **Format:** Clear and well-structured report.
