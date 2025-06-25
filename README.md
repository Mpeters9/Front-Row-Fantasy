# Front Row Fantasy

Welcome to **Front Row Fantasy** – your all-in-one toolkit for dominating fantasy football leagues!

## 🚀 Features

- **GOAT Draft Builds:**  
  Simulate the most realistic draft boards using ADP, positional runs, and advanced randomness. Get instant draft build recommendations for any league setup.

- **Lineup Optimizer:**  
  Build the best possible starting lineup for your league’s scoring and roster settings.

- **Trade Analyzer:**  
  Get instant, AI-powered feedback on any trade. See fairness, roster impact, and contextual advice.

- **Live Fantasy Ticker:**  
  Stay up to date with a real-time fantasy points ticker for top players.

- **Player Research:**  
  Quick-glance player tables with popups for stats, team, bye, and more.

## 🛠️ Usage

1. **Clone or Download** this repository.
2. Open `index.html` in your browser for the main landing page.
3. Use:
   - `goat.html` for draft builds, lineup builds, and player research.
   - `tools.html` for the trade analyzer and advanced tools.
   - `stats.html`, `players.html`, `guides.html` for more features.

## 📝 Data

- Player and ADP data are stored in JSON files (`PPR.json`, `Standard ADP.json`, etc).
- Update these files each season for the latest projections and rankings.

## 🖥️ Development

- **Tailwind CSS** is used for styling.  
  For production, install Tailwind via npm and build your CSS for best performance.  
  See [Tailwind Installation Guide](https://tailwindcss.com/docs/installation).

- **JavaScript** is modular:  
  - Page-specific code only runs if the relevant elements exist.
  - No more console errors on pages without certain features.

## 📁 Project Structure

```
/Front-Row-Fantasy
  ├─ goat.html
  ├─ tools.html
  ├─ index.html
  ├─ stats.html
  ├─ players.html
  ├─ guides.html
  ├─ script.js
  ├─ styles.css
  ├─ PPR.json
  ├─ Standard ADP.json
  ├─ Half PPR.json
  └─ ...other data files
```

## 🧹 Maintenance

- Remove or archive old player data files each season.
- Keep only the JSON files you use for your current tools.
- Refactor or split `script.js` if your project grows.

## 🙏 Credits

- Built by Mpeters9.
- Player data and projections from Sleeper, NFL, and other public sources.

---

**Enjoy building your fantasy football dynasty!**
