# 3D Land Surface Temperature Explorer

A small Three.js educational prototype for exploring how land cover, air temperature, sun intensity, humidity, and nearby cooling surfaces can affect conceptual Land Surface Temperature (LST).

This is a rule-based teaching model, not a scientific LST retrieval model.

## Project Files

- `index.html` sets up the page, controls, legend, and Three.js import map.
- `style.css` contains the layout, responsive styling, and temperature legend.
- `main.js` contains the 3D scene, land cover map, LST formula, colors, and interaction logic.
- `README.md` explains how to run and edit the prototype.

## Run Locally

Use a local web server because the app uses JavaScript modules.

```bash
npm start
```

Then open:

```text
http://localhost:4173
```

You can also run a simple server directly if Python is installed:

```bash
python -m http.server 4173
```

or on Windows:

```bash
py -m http.server 4173
```

The app imports Three.js from a CDN in `index.html`, so the browser needs internet access unless you replace those imports with local Three.js files.

## Simplified LST Model

Each landscape cell has a land cover type such as water, forest, trees, agriculture, grass/open land, building, or paved surface.

For each cell, the app calculates:

```text
LST = air temperature + land cover offset + sun effect - humidity effect + neighborhood effect
```

The default land cover offsets are:

```text
water:       -3.0
forest:      -2.5
trees:       -2.0
agriculture: -1.0
grass:        0.0
building:    2.5
paved:       3.5
```

The model also includes these simple ideas:

- Stronger sun increases LST.
- Higher humidity reduces LST.
- Water, forest, and trees cool nearby cells.
- Buildings and paved surfaces are warmer than agriculture, grass, forest, trees, and water.

## Where To Edit The Model

Open `main.js`.

To change land cover temperature behavior, edit the `LAND_COVER` object near the top of the file. Each type has:

- `offset`: direct temperature adjustment.
- `sunFactor`: how strongly sun intensity warms that cover type.
- `humidityFactor`: how strongly humidity cools that cover type.
- `coolingPower`: how much cooling it gives to nearby cells.

To change the landscape pattern, edit the `LANDSCAPE` array.

To change the formula, edit:

```js
calculateCellTemperature(type, row, col, settings)
```

To change the nearby cooling rule, edit:

```js
calculateNeighborhoodCooling(row, col)
```

To change the rainbow color scale, edit:

```js
temperatureToColor(temp, minTemp, maxTemp)
```
