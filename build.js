// Polyfills for Node.js Web APIs
global.ReadableStream = require("stream/web").ReadableStream;
global.WritableStream = require("stream/web").WritableStream;
global.TransformStream = require("stream/web").TransformStream;
global.fetch = require("undici").fetch;

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { execSync } = require("child_process");

// Function to compile CSS
function compileCSS() {
  try {
    console.log("🎨 Compiling CSS...");

    // Create src directory if it doesn't exist
    if (!fs.existsSync("src")) {
      fs.mkdirSync("src");
    }

    // Compile Tailwind CSS
    execSync("npx tailwindcss -i ./src/styles.css -o ./dist/styles.css --minify", { stdio: "inherit" });
    console.log("✅ CSS compiled successfully");
  } catch (error) {
    console.error("❌ CSS compilation failed:", error);
    throw error;
  }
}

// Main build function
async function build() {
  try {
    console.log("🚀 Starting build process...");

    // Compile CSS first
    compileCSS();

    // Dynamic imports for ES modules
    const { marked } = await import("marked");
    const markedFootnote = (await import("marked-footnote")).default;

    // Configure marked with footnotes
    // Configure marked-footnote with proper options
    marked.use(
      markedFootnote({
        prefixId: "footnote-",
        prefixLink: "footnote-ref-",
        descriptionId: "footnote-description-",
      })
    );

    // Configure marked with proper options and custom renderer for v9+ API
    marked.use({
      renderer: {
        heading(text, level) {
          // Process italics in heading text
          const processedText = text.replace(/_([^_]+)_/g, "<em>$1</em>");

          const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "") // Remove special characters
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .trim();

          const headingClasses = {
            1: "text-3xl font-bold text-stone-800 mb-6 mt-8",
            2: "text-2xl font-semibold text-stone-800 mb-4 mt-6",
            3: "text-xl font-medium text-stone-800 mb-3 mt-4",
            4: "text-lg font-medium text-stone-800 mb-2 mt-3",
          };

          return `<h${level} id="${id}" class="${
            headingClasses[level] || "text-lg font-medium text-stone-800 mb-2 mt-3"
          }">${processedText}</h${level}>`;
        },

        footnote_ref(token) {
          const id = token.id;
          return `<a href="#footnote-${id}" id="footnote-ref-${id}" class="footnote-ref">[${id}]</a>`;
        },
      },
      gfm: true, // GitHub Flavored Markdown
      tables: true, // Enable tables
      breaks: false, // No line breaks
      pedantic: false, // Don't be overly strict
      sanitize: false, // Don't sanitize HTML
      smartypants: false, // Don't use smart quotes
    });

    // Function to extract table of contents from headings
    function extractTOC(html) {
      const $ = cheerio.load(html);
      const toc = [];

      $("h1, h2, h3, h4").each(function () {
        const level = parseInt(this.tagName.substring(1));
        const text = $(this).text();
        const id = $(this).attr("id");

        toc.push({
          level,
          text,
          id,
          tag: this.tagName,
        });
      });

      return toc;
    }

    // Function to generate table of contents HTML with proper nesting
    function generateTOC(toc) {
      let tocHTML = '<div class="flex-1 overflow-y-auto toc-container"><nav class="space-y-1">';

      let chapterCount = 0;

      toc.forEach((item, index) => {
        let indent = "";
        let textSize = "text-sm";
        let fontWeight = "font-normal";
        let chapterPrefix = "";

        // Process italics in TOC text and replace "Footnotes" with "Przypisy"
        let processedTocText = item.text.replace(/_([^_]+)_/g, "<em>$1</em>");
        processedTocText = processedTocText.replace(/Footnotes/g, "Przypisy");

        // Special handling for Footnotes/Przypisy - always treat as top-level
        const isFootnotes =
          processedTocText.toLowerCase().includes("przypisy") || item.text.toLowerCase().includes("footnotes");

        // Set styling based on heading level
        if (item.level === 1 || isFootnotes) {
          fontWeight = "font-bold";
          textSize = "text-base";
          chapterCount++;
          // Don't indent footnotes, even if they're not level 1
          indent = "";
        } else if (item.level === 2) {
          indent = "ml-4";
          fontWeight = "font-semibold";
          textSize = "text-sm";
        } else if (item.level === 3) {
          indent = "ml-8";
          fontWeight = "font-medium";
          textSize = "text-xs";
        } else {
          indent = "ml-12";
          textSize = "text-xs";
        }

        tocHTML += `
          <a
            href="#${item.id}"
            class="nav-item block px-2 py-1 rounded-md ${textSize} ${fontWeight} text-stone-700 hover:bg-amber-50 ${indent} transition-colors"
          >
            ${chapterPrefix}${processedTocText}
          </a>
        `;
      });

      tocHTML += "</nav></div>";
      return tocHTML;
    }

    // Function to generate mobile TOC HTML (simplified for mobile)
    function generateMobileTOC(toc) {
      let tocHTML = '<nav class="space-y-1">';

      toc.forEach((item, index) => {
        let indent = "";
        let textSize = "text-sm";
        let fontWeight = "font-normal";

        // Process italics in TOC text and replace "Footnotes" with "Przypisy"
        let processedTocText = item.text.replace(/_([^_]+)_/g, "<em>$1</em>");
        processedTocText = processedTocText.replace(/Footnotes/g, "Przypisy");

        // Special handling for Footnotes/Przypisy - always treat as top-level
        const isFootnotes =
          processedTocText.toLowerCase().includes("przypisy") || item.text.toLowerCase().includes("footnotes");

        // Set styling based on heading level
        if (item.level === 1 || isFootnotes) {
          fontWeight = "font-bold";
          textSize = "text-base";
          indent = "";
        } else if (item.level === 2) {
          indent = "ml-3";
          fontWeight = "font-semibold";
          textSize = "text-sm";
        } else if (item.level === 3) {
          indent = "ml-6";
          fontWeight = "font-medium";
          textSize = "text-sm";
        } else {
          indent = "ml-9";
          textSize = "text-sm";
        }

        tocHTML += `
          <a
            href="#${item.id}"
            class="nav-item block px-3 py-2 rounded-md ${textSize} ${fontWeight} text-stone-700 hover:bg-amber-50 ${indent} transition-colors"
          >
            ${processedTocText}
          </a>
        `;
      });

      tocHTML += "</nav>";
      return tocHTML;
    }

    // Read the markdown file
    console.log("📖 Reading praca.md...");
    const markdownContent = fs.readFileSync("praca.md", "utf8");

    // Convert markdown to HTML
    console.log("🔄 Converting markdown to HTML...");
    let htmlContent = marked(markdownContent);

    // Post-process HTML to handle image replacements
    console.log("🖼️ Processing images...");
    htmlContent = htmlContent.replace(
      /<p><strong>Zdjęcie (\d+)\.<\/strong> (.+?)<\/p>/g,
      (match, imageNum, caption) => {
        // Determine correct file extension based on image number
        let extension = "jpg";
        if (imageNum === "2") {
          extension = "png";
        }

        return `<figure class="my-6">
          <img src="./images/image${imageNum}.${extension}" alt="${caption}" class="m-auto w-[80%] rounded-lg shadow-sm">
          <figcaption class="text-sm text-stone-600 mt-2 text-center italic">Zdjęcie ${imageNum}. ${caption}</figcaption>
        </figure>`;
      }
    );

    // Extract table of contents
    console.log("📋 Generating table of contents...");
    const toc = extractTOC(htmlContent);
    const tocHTML = generateTOC(toc);
    const mobileTocHTML = generateMobileTOC(toc);

    // Read the template HTML
    console.log("📄 Reading template HTML...");
    const templateHTML = fs.readFileSync("candomble.html", "utf8");
    const $ = cheerio.load(templateHTML);

    // Update page title and description
    $("title").text("Candomblé - religia niewolników w Brazylii XXI wieku");

    // Replace the articles section with our content
    $("#articlesContainer").html(htmlContent);

    // Update the sidebar structure for better TOC layout
    const sidebarContent = `
      <h3 class="text-lg font-semibold text-stone-800 mb-4">Spis treści</h3>
      ${tocHTML}
    `;

    // Find and update the TOC container
    const tocContainer = $("aside .bg-white.rounded-lg.shadow-sm.border.border-stone-200.p-6");
    if (tocContainer.length > 0) {
      tocContainer.addClass("flex flex-col").html(sidebarContent);
      console.log("📋 Desktop TOC updated successfully");
    } else {
      console.log("❌ Desktop TOC container not found");
    }

    // Update mobile TOC content
    const mobileTocContainer = $("#mobileTocContent");
    if (mobileTocContainer.length > 0) {
      mobileTocContainer.html(mobileTocHTML);
      console.log("📱 Mobile TOC updated successfully");
    } else {
      console.log("❌ Mobile TOC container not found");
    }

    // Create dist directory if it doesn't exist
    if (!fs.existsSync("dist")) {
      fs.mkdirSync("dist");
    }

    // Copy images directory to dist
    console.log("📁 Copying images...");
    if (fs.existsSync("images")) {
      if (!fs.existsSync("dist/images")) {
        fs.mkdirSync("dist/images");
      }

      // Copy all image files
      const imageFiles = fs.readdirSync("images");
      imageFiles.forEach((file) => {
        if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          fs.copyFileSync(`images/${file}`, `dist/images/${file}`);
        }
      });
    }

    // Write the final HTML
    console.log("💾 Writing final HTML...");
    const finalHTML = $.html();
    fs.writeFileSync("dist/index.html", finalHTML);

    console.log("✅ Build completed successfully!");
    console.log("📁 Output: dist/index.html");
    console.log(`📊 Generated TOC with ${toc.length} items`);
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

// Run the build
build();
