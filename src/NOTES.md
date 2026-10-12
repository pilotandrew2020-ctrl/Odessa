# My Odesa — source for future sessions

- `src3/*.js` + `src3/shell2.html` = game source. `python3 build3.py` → `odesa.html` (single file, published as the Claude artifact). `--debug` → `odesa3_debug.html`.
- `data/` = map data (OSM buildings/roads/rails + SRTM terrain), packed.
- Root `index.html` + `d0..d5.txt` = GitHub Pages copy (house number removed, map data split into parts).
- Artifact (Claude): https://claude.ai/artifact/EVCkmhTZ6PooYUEgLcjC9x — co-op via `room` capability; root copy uses PeerJS room codes.
- Key modules: o_game (loop, HUD, input, chunks), o_world/o_build (buildings, roads, rails), o_mats (shaders), o_land2 (stairs, Duke, landmarks), o_parks, o_port, o_station, o_opera, o_interiors (market/pharmacy/flat), o_trams, o_people (avatars), o_coop (multiplayer), o_drive (car).
- Testing: headless Playwright screenshots (shoot.py / cam.py make step lists for a runner).

## Next batch the user asked for
Lanzheron + cable car + shops under it; gas station / marshrutka / houses / garages left of Williams (Chykalenka) St; proper car model; Tavria, car wash, enterable neighbouring houses and shops; seats in the railway station; bigger Greek & Istanbul parks; bigger 411th Battery.
