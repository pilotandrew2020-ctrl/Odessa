# My Odesa — source for future sessions

- `src3/*.js` + `src3/shell2.html` = game source. `python3 build3.py` → `odesa.html` (single file, published as the Claude artifact). `--debug` → `odesa3_debug.html`.
- `data/` = map data (OSM buildings/roads/rails + SRTM terrain), packed.
- Root `index.html` + `d0..d5.txt` = GitHub Pages copy (house number removed, map data split into parts).
- Artifact (Claude): https://claude.ai/artifact/EVCkmhTZ6PooYUEgLcjC9x — co-op via `room` capability; root copy uses PeerJS room codes.
- Key modules: o_game (loop, HUD, input, chunks), o_world/o_build (buildings, roads, rails), o_mats (shaders), o_land2 (stairs, Duke, landmarks), o_parks, o_port, o_station, o_opera, o_interiors (market/pharmacy/flat), o_trams, o_people (avatars), o_coop (multiplayer), o_drive (car).
- Testing: headless Playwright screenshots (shoot.py / cam.py make step lists for a runner).

## Done (batch 2)
Lanzheron cable car (o_lanz.js, ridable, shops under it); proper lofted car models + Tavria/Lada/Lanos (o_cars.js); gas station, marshrutka stop, garages, enterable car wash / Ryaba / garages (o_azs.js, interiors at INT_X+800..); station benches sit-able; parks get promenades/beds/gazebos (parkWalk), flowers follow terrain, groundQuad subdivides on slopes; bigger 411 battery + memorial plaza; Duke plaque + restaurant sign.
Open: user photos to refine gas-station spot and details.
