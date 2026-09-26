const fs = require('fs');

try {
    const mdContent = fs.readFileSync('eo_ro_part_b_rajasthan_municipalities_act.md', 'utf8');
    const base64Md = Buffer.from(mdContent).toString('base64');

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>RPSC EO/RO Study Guide</title>
    <!-- Marked.js for markdown parsing -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <!-- Mermaid.js for diagrams -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <!-- GitHub Markdown CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
    <style>
        body { background-color: #f6f8fa; padding: 40px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        .container { max-width: 980px; margin: 0 auto; background: white; padding: 45px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .mermaid { text-align: center; margin: 20px 0; }
        .markdown-body blockquote { border-left: 4px solid #0366d6; background-color: #f1f8ff; padding: 10px 15px; color: #24292e; }
        .markdown-body blockquote strong { color: #005cc5; }
    </style>
    </head>
    <body>
    <div class="container markdown-body">
        <div style="text-align: right; margin-bottom: 20px;">
            <a href="topicwise_questions_and_pyqs.html" style="background-color: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Practice Questions & PYQs</a>
        </div>
        <div id="content"></div>
    </div>
    <script>
        // Initialize mermaid
        mermaid.initialize({ startOnLoad: false });

        const base64Md = "${base64Md}";
        
        // Safely decode UTF-8 from Base64
        const text = atob(base64Md);
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
            bytes[i] = text.charCodeAt(i);
        }
        const md = new TextDecoder('utf-8').decode(bytes);
        
        // Parse markdown and inject
        document.getElementById('content').innerHTML = marked.parse(md);

        // Render mermaid diagrams
        const codeBlocks = document.querySelectorAll('code.language-mermaid');
        codeBlocks.forEach((block, index) => {
            const pre = block.parentElement;
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = block.textContent;
            pre.replaceWith(div);
        });
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    </script>
    </body>
    </html>`;

    fs.writeFileSync('preview.html', htmlContent);
    console.log('preview.html created successfully!');
} catch (error) {
    console.error('Error:', error);
}
