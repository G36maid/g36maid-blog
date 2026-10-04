---
title: "Recreating the 'Tactile Bump': Haptic Rendering"
description: "1. The Physics: Snap-Through Buckling"
pubDate: 2025-11-28 06:54:18 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1764284058
category: essay
---

![image](https://hackmd.io/_uploads/B1yKN6IbZg.png)

**1. The Physics: Snap-Through Buckling**
-**Core Mechanism:** Negative Stiffness Instability.
-**Key Metric:** **Snap Ratio > 40%** (Required for "Crisp" feel).
-**Target:** Simulate the sudden force drop ($F_{valley}$) of a metal dome.

###  System Sketch


```mermaid
graph LR
    %% --- 定義樣式 ---
    classDef physical fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b,rx:5,ry:5;
    classDef sensor fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:#f57f17,rx:5,ry:5;
    classDef compute fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px,color:#1a237e,rx:5,ry:5;
    classDef actuator fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#b71c1c,rx:5,ry:5;
    classDef data fill:#ffffff,stroke:#607d8b,stroke-width:1px,stroke-dasharray: 5 5,color:#455a64,rx:0,ry:0;

    
    Finger([fa:fa-hand-pointer User Finger]):::physical
    Keycap[Keycap Interface]:::physical
    FSR(fa:fa-compress Force Sensor):::sensor
    MCU{{fa:fa-microchip Microcontroller<br/>PID Control}}:::compute
    Profile[(Target F-D Curve<br/>Data lookup)]:::data
    Driver[Haptic Driver / Amp]:::actuator
    VCA(fa:fa-magnet Voice Coil Actuator):::actuator
    Speaker(fa:fa-volume-up Speaker):::actuator

   
    Finger -- Press Force ($F_{in}$) --> Keycap
    Keycap -- Mechanical Coupling --> FSR
    FSR -- Analog Signal --> MCU
    
    subgraph Digital Processing Loop
        MCU == Read Position/Force ==> Profile
        Profile == Target Resistance Value ==> MCU
    end
    
    MCU -- PWM/DAC Signal --> Driver
    Driver -- Driving Current ($I_{out}$) --> VCA
    VCA -- "Snap-through" Feedback Force ($F_{out}$) --> Keycap
    
    MCU -. Sync Audio Trigger .-> Speaker
    
    
    linkStyle 6 stroke:#d32f2f,stroke-width:3px,fill:none;
```

**2. The Tech: Piezo-as-Sensor Architecture**
-**Actuator:** Piezoelectric (PZT) vs. LRA.
    --*Advantage:* **< 2ms Rise Time** (Instant shock).
    --*Control:* **Active Braking** (Eliminates "buzzing" ringing).
-**Sensing:** Zero-latency closed-loop.
    --*Method:* **CapDrive** (Piezo acts as both sensor & motor).

### References (Academic Papers)

 [1] Kim, S., & Lee, G. (2013). Haptic feedback design for a virtual button along force-displacement curves. UIST '13.
[2] Liao, Y.-C., et al. (2018). One button to rule them all: Rendering arbitrary force-displacement curves. UIST '18.
