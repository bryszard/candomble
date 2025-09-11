const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// Main build function
async function build() {
  try {
    console.log("🚀 Starting build process...");

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

    // Configure marked with proper options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      tables: true, // Enable tables
      breaks: false, // No line breaks
      pedantic: false, // Don't be overly strict
      sanitize: false, // Don't sanitize HTML
      smartypants: false, // Don't use smart quotes
    });

    // Custom renderer only for headings to add IDs
    const renderer = new marked.Renderer();

    // Custom heading renderer to add IDs for navigation
    renderer.heading = function (token) {
      const text = token.text || "";
      const level = token.depth || 1;

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
    };

    // Custom renderer for footnotes to ensure proper reference anchors
    renderer.footnote_ref = function (token) {
      const id = token.id;
      return `<a href="#footnote-${id}" id="footnote-ref-${id}" class="footnote-ref">[${id}]</a>`;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartypants: false,
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
      console.log("📋 TOC updated successfully");
    } else {
      console.log("❌ TOC container not found");
    }

    // Add custom CSS for markdown content
    const customCSS = `
      <style>
        /* Markdown content styling */
        #articlesContainer p { margin-bottom: 1rem; line-height: 1.7; }
        #articlesContainer em { font-style: italic; color: #92400e; }
        #articlesContainer strong { font-weight: bold; color: #451a03; }
        #articlesContainer table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
        #articlesContainer th, #articlesContainer td {
          border: 1px solid #d6d3d1;
          padding: 0.75rem;
          text-align: left;
        }
        #articlesContainer th {
          background-color: #f5f5f4;
          font-weight: 600;
          color: #92400e;
        }
        #articlesContainer tr:nth-child(even) { background-color: #fafaf9; }
        #articlesContainer blockquote {
          border-left: 4px solid #d97706;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #78716c;
        }
        #articlesContainer ul, #articlesContainer ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        #articlesContainer ul { list-style-type: disc; }
        #articlesContainer ol { list-style-type: decimal; }
        #articlesContainer li { margin-bottom: 0.5rem; }

        /* Nested list styling */
        #articlesContainer ul ul { list-style-type: circle; }
        #articlesContainer ul ul ul { list-style-type: square; }
        #articlesContainer ol ol { list-style-type: lower-alpha; }
        #articlesContainer ol ol ol { list-style-type: lower-roman; }

        /* Footnotes styling */
        .footnotes {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #e7e5e4;
          scroll-margin-top: 300px; /* 300px space above footnotes when scrolling */
        }

        /* Ensure all headings have proper scroll offset */
        h1, h2, h3, h4, h5, h6 {
          scroll-margin-top: 300px;
        }
        .footnotes ol { font-size: 0.875rem; }
        .footnotes li {
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.3s ease;
        }
        .footnotes li:target {
          background-color: #fef3c7; /* Highlight when targeted */
          border-left: 4px solid #d97706;
        }

        /* Ensure footnote backlinks also get proper scroll offset */
        .footnotes a[href^="#footnote-"] {
          scroll-margin-top: 300px;
        }

        /* Ensure footnote references in content get proper scroll offset */
        a[id^="footnote-ref-"] {
          scroll-margin-top: 300px;
        }

        /* Scroll indicator for TOC - always reserve space to prevent content shifting */
        .toc-container::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        .toc-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .toc-container::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        .toc-container:hover::-webkit-scrollbar-thumb {
          background: #d97706;
        }
        .toc-container:focus::-webkit-scrollbar-thumb {
          background: #d97706;
        }

        /* Reserve space for scrollbar */
        .toc-container {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .toc-container:hover {
          scrollbar-color: #d97706 transparent;
        }
        .toc-container:focus {
          scrollbar-color: #d97706 transparent;
        }

        /* Ensure TOC takes full height and can scroll */
        aside .bg-white.rounded-lg.shadow-sm.border.border-stone-200.p-6.flex.flex-col {
          height: calc(100vh - 400px);
          max-height: calc(100vh - 400px);
        }

        /* Ensure TOC container can scroll */
        .toc-container {
          max-height: calc(100vh - 450px);
          overflow-y: auto;
        }

      </style>
    `;

    const existingScript = $("script").last().html();
    $("script").last().html(existingScript);

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

    // Add custom CSS to head (just before writing)
    const headElement = $("head");
    console.log("🔍 Head element found:", headElement.length);
    headElement.append(customCSS);
    console.log("🎨 Custom CSS injected");

    // Debug: Check if CSS was added
    const headHTML = $("head").html();
    console.log("🔍 Head HTML contains CSS:", headHTML.includes("list-style-type"));

    // Write the final HTML
    console.log("💾 Writing final HTML...");
    const finalHTML = $.html();
    console.log("🔍 HTML contains CSS:", finalHTML.includes("scroll-margin-top"));
    console.log("🔍 HTML contains footnote CSS:", finalHTML.includes("footnote"));
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
