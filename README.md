# 3D Land Surface Temperature Explorer
A small **Codex-assisted 3D web prototype** for exploring how **air temperature**, **sun intensity**, **humidity**, and **land cover** can influence conceptual **Land Surface Temperature (LST)** across a mixed landscape.

This project was created as an experiment with **OpenAI Codex** to explore how AI-assisted coding can help rapidly build interactive scientific visualization prototypes.

> Note: This is a **rule-based educational simulation**, not a scientifically validated LST retrieval or energy balance model.

<img width="1959" height="1219" alt="Codex" src="https://github.com/user-attachments/assets/e6428364-e5a5-40ca-b957-a64ad217e895" />

---

## Why I built this
I am a PhD researcher working on **monitoring heatwaves at landscape scale**.  
I wanted to test whether I could use Codex to quickly build a **simple interactive 3D prototype** showing how land use and environmental conditions may affect surface temperature patterns.

The idea was to simulate a small mixed landscape with:
- water body
- forest
- trees
- agriculture
- grass/open land
- buildings
- paved surfaces

and allow the user to interactively change:
- **Air Temperature**
- **Sun Intensity**
- **Humidity**

The resulting **Land Surface Temperature (LST)** is visualized using a rainbow color scale, where **red indicates hotter surfaces**.

---

## What this project demonstrates
- Rapid prototyping with **Codex**
- A simple **3D browser-based environmental visualization**
- A conceptual **LST response model**
- Interactive parameter control with immediate visual feedback
- Mixed land-use temperature behavior in a small landscape scene

---

## Features
- Small interactive **3D landscape**
- Mixed land cover classes
- Adjustable sliders for:
  - air temperature
  - sun intensity
  - humidity
- Real-time update of conceptual **LST**
- Rainbow temperature color scale
- Temperature legend
- Hover/click cell information
- Orbit/zoom camera controls
- Reset button

---

## How Codex was used
This repository is part of my learning journey with **Codex**.

I used Codex to:
- translate my idea into a working web prototype
- generate the initial project structure
- implement the Three.js-based 3D visualization
- build the interactive controls and temperature logic
- create a runnable first version quickly

My role was to:
- define the scientific idea and scope
- specify the environmental variables and land-cover behavior
- decide the simplification level
- review and test the generated result
- evaluate whether the prototype matched the intended concept

This project reflects a **human-directed, AI-assisted workflow**.

---

## What I learned from this Codex experiment
- Codex can be very useful for creating a **first working prototype** from a well-written prompt
- Clear problem framing matters a lot
- It is better to request a **simple conceptual model first**, rather than a fully scientific model
- AI coding tools are especially helpful for:
  - UI scaffolding
  - visualization
  - interactive controls
  - prototyping new ideas quickly

---

## Tech stack
- **HTML**
- **CSS**
- **JavaScript**
- **Three.js**

---

## Run locally
Because the app uses JavaScript modules, run it with a local server.

---

## Simplified LST model
For each landscape cell, the simulator uses a simple conceptual formula:
```
LST = air temperature + land cover offset + sun effect - humidity effect + neighborhood cooling effect
```
Example default land cover offsets:
```
water:       -3.0
forest:      -2.5
trees:       -2.0
agriculture: -1.0
grass:        0.0
building:    +2.5
paved:       +3.5
```

Conceptual assumptions:
- stronger sun increases LST
- higher humidity slightly reduces LST
- water, forest, and trees cool nearby cells
- buildings and paved surfaces are warmer than vegetated land

---

## Limitations
This prototype is intentionally simplified.

It does not include:
- physically based energy balance modeling
- evapotranspiration processes
- radiative transfer
- real remote sensing retrieval
- calibration against field measurements
- GIS-based real-world landscape input

So this should be interpreted as:
- a visual teaching tool
- a conceptual heat landscape simulator
- an early-stage prototype for idea exploration

---

## Possible next steps
- add time-of-day controls
- add seasonal variation
- add wind effects
- add export of summary statistics
- compare average LST by land cover type
- connect the visualization to real spatial data
- improve the temperature model with more realistic environmental relationships


<img width="1957" height="1222" alt="Codex_Agriculture Field" src="https://github.com/user-attachments/assets/e8eebae9-e403-4578-97e2-af7b562ee1dc" />
<img width="1959" height="1214" alt="Codex_Water Body" src="https://github.com/user-attachments/assets/d1ccb602-6c1e-406d-b1db-91676a6790a0" />
<img width="1958" height="1222" alt="Codex_Tree" src="https://github.com/user-attachments/assets/3ab95568-bb07-446a-ad5a-0fcc9fe5580e" />
<img width="1957" height="1214" alt="Codex_Forest" src="https://github.com/user-attachments/assets/d1e2bbc5-f6d3-45b6-8996-56189ebd5c5d" />
<img width="2315" height="1301" alt="Codex_Road" src="https://github.com/user-attachments/assets/b16e5410-4be2-48fd-b0a0-0a2075301f0e" />
