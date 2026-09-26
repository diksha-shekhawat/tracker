const fs = require('fs');

try {
    const mdContent = fs.readFileSync('topicwise_questions_and_pyqs.md', 'utf8');
    const base64Md = Buffer.from(mdContent).toString('base64');

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>Practice Questions & PYQs</title>
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
        details { margin-top: 10px; margin-bottom: 10px; }
        summary { 
            cursor: pointer; 
            background-color: #0366d6; 
            color: white; 
            padding: 8px 15px; 
            border-radius: 5px; 
            display: inline-block; 
            font-weight: bold; 
            user-select: none;
            transition: background-color 0.2s;
        }
        summary:hover { background-color: #005cc5; }
        details[open] summary {
            background-color: #f1f8ff;
            color: #0366d6;
            border: 1px solid #0366d6;
            padding: 7px 14px;
        }
        details .answer-box {
            margin-top: 15px;
            padding: 12px 15px;
            background-color: #e6ffed;
            border-left: 5px solid #28a745;
            color: #24292e;
            border-radius: 0 4px 4px 0;
            font-size: 1.05em;
        }
        ul { list-style-type: none; padding-left: 10px; }
        li { margin-bottom: 5px; }
    </style>
    </head>
    <body>
    <div class="container markdown-body">
        <div style="text-align: left; margin-bottom: 20px;">
            <a href="preview.html" style="background-color: #f1f8ff; color: #0366d6; border: 1px solid #0366d6; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">&larr; Back to Study Guide</a>
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

    fs.writeFileSync('topicwise_questions_and_pyqs.html', htmlContent);
    console.log('topicwise_questions_and_pyqs.html created successfully!');
} catch (error) {
    console.error('Error:', error);
}
