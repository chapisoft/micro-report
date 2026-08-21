const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function exportDocx(inputFile) {
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: File not found: ${inputFile}`);
        process.exit(1);
    }

    const inputDir = path.dirname(inputFile);
    const basename = path.basename(inputFile, '.md');
    const tmpDir = path.join(inputDir, '.tmp_pandoc');
    const outputFile = path.join(inputDir, `${basename}.docx`);

    // Create a temporary directory for intermediate files
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    let content = fs.readFileSync(inputFile, 'utf8');

    // Regex to match mermaid blocks and the following div caption
    // Pattern: ```mermaid\n(.*?)\n```\n\n<div align="center"><i>(Hình: .*?)</i></div>
    // This allows converting Mermaid diagrams to proper images with markdown captions
    const regex = /```mermaid\n([\s\S]*?)\n```[\s\S]*?<div align="center"><i>(.*?)<\/i><\/div>/g;

    let counter = 1;
    content = content.replace(regex, (match, mermaidCode, caption) => {
        const mmdFile = path.join(tmpDir, `diagram_${counter}.mmd`);
        const pngFile = path.join(tmpDir, `diagram_${counter}.png`);

        fs.writeFileSync(mmdFile, mermaidCode);
        console.log(`Generating diagram_${counter}.png for caption: ${caption}`);

        try {
            // Using npx to run mermaid-cli
            // IMPORTANT: npx should have @mermaid-js/mermaid-cli cached
            execSync(`npx -y @mermaid-js/mermaid-cli -i "${mmdFile}" -o "${pngFile}" -b white`);
        } catch (e) {
            console.error(`Error generating diagram_${counter}.png:`, e.message);
        }

        counter++;
        return `![${caption}](${path.basename(pngFile)})`;
    });

    // Convert GitHub Alerts to visually distinct blockquotes with Emojis
    content = content.replace(/^>\s*\[!NOTE\]/gm, '> **ℹ️ LƯU Ý:**');
    content = content.replace(/^>\s*\[!TIP\]/gm, '> **💡 MẸO:**');
    content = content.replace(/^>\s*\[!IMPORTANT\]/gm, '> **🚨 QUAN TRỌNG:**');
    content = content.replace(/^>\s*\[!WARNING\]/gm, '> **⚠️ CẢNH BÁO:**');
    content = content.replace(/^>\s*\[!CAUTION\]/gm, '> **🛑 NGUY HIỂM:**');

    const pandocMdFile = path.join(tmpDir, `${basename}_pandoc.md`);
    fs.writeFileSync(pandocMdFile, content);

    console.log(`Exporting docx to ${outputFile}...`);
    try {
        // Run pandoc in the tmp directory so it resolves relative paths correctly for diagram images, but set resource-path to the parent directory for original assets
        execSync(`pandoc "${path.basename(pandocMdFile)}" --toc --toc-depth=3 --resource-path="..:." -o "../${path.basename(outputFile)}"`, { cwd: tmpDir });
        console.log(`Successfully generated ${outputFile}`);
    } catch (e) {
        console.error(`Error running pandoc:`, e.message);
    }

    // Clean up temporary directory
    console.log(`Cleaning up temporary files...`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Usage: node export_docx.js <path/to/markdown.md>");
    process.exit(1);
}

exportDocx(path.resolve(args[0]));
