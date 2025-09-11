# Candomblé - Master's Thesis Presentation

This project presents Piotr Brych's 2014 master's thesis on Candomblé (Afro-Brazilian religion) in a modern, web-friendly format for Polish audiences.

## Project Structure

```
/candomble/
├── praca.md              # Source content (Markdown)
├── candomble.html        # HTML template
├── build.js              # Build script
├── package.json          # Dependencies
├── images/               # Static assets (8 images)
├── dist/
│   ├── index.html        # Generated final file
│   └── images/           # Copied image assets
└── README.md
```

## Build Process

This project uses a static site generation approach:

1. **Source**: `praca.md` - The original thesis content in Markdown
2. **Template**: `candomble.html` - Beautiful HTML template with styling
3. **Build Script**: `build.js` - Processes Markdown and generates final HTML
4. **Output**: `dist/index.html` - Self-contained, ready-to-serve HTML file

## Features

- ✅ **Complete Academic Content**: Full master's thesis in Polish
- ✅ **Professional Styling**: Modern, responsive design with Tailwind CSS
- ✅ **Table of Contents**: Auto-generated navigation with smooth scrolling
- ✅ **Image Integration**: 6 strategically placed images from the thesis
- ✅ **Academic Footnotes**: Properly formatted references and citations
- ✅ **Progress Bar**: Visual reading progress indicator
- ✅ **Mobile Responsive**: Works on all device sizes

## How to Build

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **View the result:**
   Open `dist/index.html` in your browser

## Technical Details

- **Markdown Processing**: marked.js with footnotes support
- **HTML Manipulation**: cheerio for DOM processing
- **Styling**: Tailwind CSS + DaisyUI
- **Images**: Custom renderer handles "Zdjęcie X" markers with correct file extensions
- **Assets**: Images automatically copied to dist folder during build
- **Navigation**: Auto-generated TOC from headings

## Content Overview

The presentation covers:

1. **I. Wstęp** - Introduction and research questions
2. **II. Korzenie candomblé** - Historical roots and slavery context
3. **III. Candomblé – narodziny i rozwój** - Birth and development
4. **IV. Podstawy wierzeń i rytuałów** - Beliefs and rituals
5. **V. _Candomblé_ jako religia XXI w.** - Candomblé as a religion in the 21st century
6. **VI. Wnioski** - Conclusions

## Author

**Piotr Brych** - Master's Thesis 2014
_"Candomblé - religia niewolników w Brazylii XXI wieku"_

## License

Academic work - for educational and research purposes.
