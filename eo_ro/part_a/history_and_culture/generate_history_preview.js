const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// File paths
const markdownFile = path.join(__dirname, 'history_culture_notes.md');
const htmlOutputFile = path.join(__dirname, 'history_preview.html');

// Read markdown
const markdownContent = fs.readFileSync(markdownFile, 'utf-8');

// Custom Marked Renderer for clean, accurate Heading IDs and Anchor Links
const renderer = {
  heading({ tokens, depth, text }) {
    // Clean text of any HTML tags for slug generation
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    
    // Check if this is a primary Chapter Title (Level 1 starting with Chapter <N>)
    const chapterMatch = (depth === 1) && cleanText.match(/^Chapter\s+(\d+)/i);
    
    let primaryId = '';
    let fallbackId = '';
    
    if (chapterMatch) {
      const chNum = chapterMatch[1];
      primaryId = `chapter-${chNum}`;
      fallbackId = cleanText
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const inlineContent = this.parser.parseInline(tokens);

      return `
        <div class="chapter-target-anchor" id="${primaryId}"></div>
        <div class="chapter-target-anchor" id="${fallbackId}"></div>
        <h1 class="chapter-header" data-chapter="${chNum}">
          <span class="chapter-num-badge">CHAPTER ${chNum}</span>
          <div class="chapter-title-text">${inlineContent}</div>
        </h1>
      `;
    }

    // For all other headings (h2, h3, h4, or non-chapter h1)
    primaryId = cleanText
      .toLowerCase()
      .replace(/[^\w\u0900-\u097F]+/g, '-')
      .replace(/^-+|-+$/g, '');

    fallbackId = cleanText
      .toLowerCase()
      .replace(/[^\w]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const inlineContent = this.parser.parseInline(tokens);

    return `
      <h${depth} id="${primaryId}" data-slug="${fallbackId}">
        <a class="heading-anchor" href="#${primaryId}" title="Direct link to this section">#</a>
        ${inlineContent}
      </h${depth}>
    `;
  }
};

marked.use({ renderer });

// Parse markdown to HTML
let htmlBody = marked.parse(markdownContent);

// Pre-process htmlBody to stamp data-correct on cards and data-opt on options statically
htmlBody = htmlBody.replace(/<div class="pyq-card">([\s\S]*?)<\/details>\s*<\/div>/g, (fullMatch, cardInner) => {
    // Extract correct answer key
    const ansMatch = cardInner.match(/<div class="pyq-ans-badge">✅ Correct Answer:\s*<strong>\(([A-Da-d1-4])\)/i);
    let correctKey = 'A';
    if (ansMatch) {
        let k = ansMatch[1].toUpperCase();
        if (k === '1') k = 'A';
        if (k === '2') k = 'B';
        if (k === '3') k = 'C';
        if (k === '4') k = 'D';
        correctKey = k;
    }

    // Stamp data-opt on each option
    let optIndex = 0;
    const defaultKeys = ['A', 'B', 'C', 'D'];
    let updatedInner = cardInner.replace(/<div class="pyq-opt">([\s\S]*?)<\/div>/g, (optMatch, optContent) => {
        const keyMatch = optContent.match(/<strong>\(([A-Da-d1-4])\)<\/strong>/i);
        let optKey = keyMatch ? keyMatch[1].toUpperCase() : defaultKeys[optIndex] || 'A';
        if (optKey === '1') optKey = 'A';
        if (optKey === '2') optKey = 'B';
        if (optKey === '3') optKey = 'C';
        if (optKey === '4') optKey = 'D';
        optIndex++;
        return `<div class="pyq-opt" data-opt="${optKey}">${optContent}</div>`;
    });

    return `<div class="pyq-card" data-correct="${correctKey}">\n${updatedInner}\n</details>\n</div>`;
});

// Wrap in full HTML document with elite Rajasthan GK coaching styling & SINGLE sticky navigation + Interactive MCQ Quiz Engine
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rajasthan History & Culture — Master Revision & Coaching Guide (EO/RO Part A)</title>
<!-- Google Fonts: Plus Jakarta Sans & Outfit -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- GitHub Markdown CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
<style>
    :root {
        --primary-color: #8b0000; /* Rajasthani Royal Crimson */
        --primary-dark: #6b0000;
        --secondary-color: #0d47a1; /* Royal Blue */
        --accent-gold: #d4af37;
        --bg-color: #f1f5f9;
        --text-color: #1e293b;
        --nav-height: 60px;
        --success-green: #16a34a;
        --error-red: #dc2626;
    }
    
    html {
        scroll-behavior: smooth;
    }
    
    body { 
        background-color: var(--bg-color); 
        padding: 0; 
        margin: 0; 
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        color: var(--text-color);
        line-height: 1.75;
        overflow-x: hidden;
    }

    /* Reading Progress Bar */
    #progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(90deg, #d97706, #dc2626, #9333ea, #2563eb);
        width: 0%;
        z-index: 1000;
        transition: width 0.1s ease-out;
    }

    /* Canvas for Crackers & Confetti Fireworks Burst */
    #fireworks-canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 10000;
    }

    /* THE SINGLE UNIFIED STICKY TOP NAVIGATION BAR */
    .sticky-navbar {
        position: sticky;
        top: 0;
        background: rgba(255, 255, 255, 0.97);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 2px solid #e2e8f0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        height: var(--nav-height);
    }
    .nav-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 1.12em;
        color: var(--primary-color);
        text-decoration: none;
    }
    .nav-brand-badge {
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        font-size: 0.76em;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid #f87171;
        letter-spacing: 0.5px;
    }

    .nav-actions {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .chapter-select-dropdown {
        padding: 8px 16px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        background: #ffffff;
        font-family: inherit;
        font-size: 0.9em;
        font-weight: 700;
        color: #0f172a;
        cursor: pointer;
        outline: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        transition: all 0.2s;
    }
    .chapter-select-dropdown:hover, .chapter-select-dropdown:focus {
        border-color: var(--secondary-color);
        box-shadow: 0 0 0 3px rgba(13, 71, 161, 0.18);
    }

    .nav-btn-partb {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #0d47a1, #1e40af);
        border: 1px solid #1e3a8a;
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 0.88em;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 2px 8px rgba(13, 71, 161, 0.25);
        transition: all 0.2s;
    }
    .nav-btn-partb:hover {
        background: linear-gradient(135deg, #1e40af, #1d4ed8);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(13, 71, 161, 0.35);
        color: white;
    }

    .container { 
        max-width: 1060px; 
        margin: 30px auto 60px auto; 
        background: #ffffff; 
        padding: 50px 65px; 
        border-radius: 18px; 
        box-shadow: 0 12px 40px rgba(0,0,0,0.06); 
    }

    /* Chapter Target Anchors & Offsets */
    .chapter-target-anchor {
        position: relative;
        top: -85px;
        visibility: hidden;
        display: block;
        height: 0;
    }

    h1, h2, h3, h4 {
        scroll-margin-top: 85px;
        position: relative;
    }
    
    .heading-anchor {
        position: absolute;
        left: -24px;
        color: #cbd5e1;
        text-decoration: none;
        font-weight: 400;
        font-size: 0.85em;
        opacity: 0;
        transition: opacity 0.2s;
    }
    h1:hover .heading-anchor, h2:hover .heading-anchor, h3:hover .heading-anchor {
        opacity: 1;
    }
    .heading-anchor:hover {
        color: var(--secondary-color);
    }

    /* Chapter Heading Card */
    .chapter-header {
        background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
        border: 2px solid #fecaca;
        border-left: 8px solid var(--primary-color);
        padding: 26px 30px;
        border-radius: 14px;
        margin-top: 55px;
        margin-bottom: 25px;
        box-shadow: 0 4px 18px rgba(139, 0, 0, 0.06);
    }
    .chapter-num-badge {
        display: inline-block;
        background: var(--primary-color);
        color: #ffffff;
        font-family: 'Outfit', sans-serif;
        font-size: 0.75em;
        font-weight: 800;
        letter-spacing: 1.5px;
        padding: 4px 12px;
        border-radius: 6px;
        margin-bottom: 10px;
    }
    .chapter-title-text {
        color: #7f1d1d;
        font-family: 'Outfit', sans-serif;
        font-size: 1.7em;
        font-weight: 800;
        line-height: 1.35;
        margin: 0;
    }

    h2 { 
        color: var(--secondary-color); 
        margin-top: 40px; 
        border-bottom: 2px solid #e2e8f0; 
        padding-bottom: 8px; 
        font-size: 1.45em; 
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
    }
    h3 { 
        color: #0f172a; 
        background: #f8fafc; 
        padding: 10px 16px; 
        border-left: 5px solid var(--secondary-color); 
        border-radius: 6px; 
        font-size: 1.2em; 
        margin-top: 30px; 
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
    }
    h4 {
        color: #1e293b;
        font-size: 1.08em;
        margin-top: 22px;
        font-weight: 700;
    }
    
    /* Highlighted Keywords */
    .markdown-body strong { color: #0369a1; font-weight: 700; }
    
    /* 1. Story Box (Springboard / Rajveer Sir Classroom Lore) */
    .story-box {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-left: 6px solid #d97706;
        border-radius: 10px;
        padding: 20px 24px;
        margin: 24px 0;
        font-size: 0.98em;
        line-height: 1.75;
        color: #78350f;
        box-shadow: 0 4px 12px rgba(217, 119, 6, 0.08);
    }
    .story-title {
        font-weight: 800;
        color: #b45309;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1em;
        font-family: 'Outfit', sans-serif;
    }

    /* 2. Mental Map & Conceptual Framework */
    .mental-map-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-left: 6px solid #16a34a;
        border-radius: 10px;
        padding: 20px 24px;
        margin: 24px 0;
        font-size: 0.98em;
        color: #14532d;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.08);
    }
    .mental-map-title {
        font-weight: 800;
        color: #15803d;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1em;
        font-family: 'Outfit', sans-serif;
    }

    /* 3. Examiner Traps & Common Confusions */
    .trap-box {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-left: 6px solid #dc2626;
        border-radius: 10px;
        padding: 20px 24px;
        margin: 24px 0;
        font-size: 0.98em;
        color: #7f1d1d;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.08);
    }
    .trap-title {
        font-weight: 800;
        color: #b91c1c;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1em;
        font-family: 'Outfit', sans-serif;
    }

    /* 4. PYQ Insights & Examiner Mindset */
    .pyq-box {
        background: #faf5ff;
        border: 1px solid #e9d5ff;
        border-left: 6px solid #9333ea;
        border-radius: 10px;
        padding: 20px 24px;
        margin: 24px 0;
        font-size: 0.98em;
        color: #581c87;
        box-shadow: 0 4px 12px rgba(147, 51, 234, 0.08);
    }
    .pyq-title {
        font-weight: 800;
        color: #7e22ce;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1em;
        font-family: 'Outfit', sans-serif;
    }

    /* 5. Terminology Decoder */
    .term-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-left: 6px solid #2563eb;
        border-radius: 10px;
        padding: 20px 24px;
        margin: 24px 0;
        font-size: 0.98em;
        color: #1e3a8a;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
    }
    .term-title {
        font-weight: 800;
        color: #1d4ed8;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1em;
        font-family: 'Outfit', sans-serif;
    }

    /* 6. Memory Hooks & Mnemonics */
    .mnemonic-box {
        background: #fdf4ff;
        border: 1px solid #f5d0fe;
        border-left: 6px solid #c026d3;
        border-radius: 10px;
        padding: 20px 24px;
        margin: 24px 0;
        font-size: 0.98em;
        color: #701a75;
        box-shadow: 0 4px 12px rgba(192, 38, 211, 0.08);
    }
    .mnemonic-title {
        font-weight: 800;
        color: #a21caf;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1em;
        font-family: 'Outfit', sans-serif;
    }

    /* ========================================================
       TOPIC-WISE INTERACTIVE PYQ CARDS STYLING
       ======================================================== */
    .pyq-card {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-left: 6px solid #4f46e5;
        border-radius: 14px;
        padding: 24px 28px;
        margin: 28px 0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        position: relative;
        transition: all 0.25s ease;
    }
    .pyq-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 8px 24px rgba(79, 70, 229, 0.08);
    }

    /* CELEBRATION EFFECT (CORRECT) */
    .pyq-card.celebrate-active {
        border-left-color: #16a34a !important;
        border-color: #86efac !important;
        box-shadow: 0 0 32px rgba(34, 197, 94, 0.28) !important;
        animation: celebrateBounce 0.5s ease;
    }
    @keyframes celebrateBounce {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }

    /* SIREN ALARM EFFECT (WRONG) */
    .pyq-card.siren-active {
        border-left-color: #dc2626 !important;
        border-color: #f87171 !important;
        box-shadow: 0 0 35px rgba(220, 38, 38, 0.35) !important;
        animation: sirenWobble 0.45s ease-in-out 2, sirenFlash 0.6s infinite alternate;
    }
    @keyframes sirenWobble {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-9px) rotate(-1deg); }
        40% { transform: translateX(9px) rotate(1deg); }
        60% { transform: translateX(-6px) rotate(-0.5deg); }
        80% { transform: translateX(6px) rotate(0.5deg); }
    }
    @keyframes sirenFlash {
        0% { background-color: #ffffff; }
        100% { background-color: #fef2f2; }
    }

    /* Interactive Alert Banners */
    .pyq-feedback-banner {
        display: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 0.94em;
        font-weight: 800;
        margin-bottom: 16px;
        align-items: center;
        gap: 10px;
        animation: fadeIn 0.3s ease;
    }
    .pyq-feedback-banner.success {
        display: flex;
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        color: #14532d;
        border: 1.5px solid #86efac;
    }
    .pyq-feedback-banner.error {
        display: flex;
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        border: 1.5px solid #f87171;
    }

    .pyq-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
        flex-wrap: wrap;
        gap: 8px;
    }
    .pyq-qno {
        background: linear-gradient(135deg, #4f46e5, #4338ca);
        color: #ffffff;
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 0.85em;
        padding: 3px 12px;
        border-radius: 6px;
        letter-spacing: 0.5px;
    }
    .pyq-exam-badge {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
        font-size: 0.82em;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
    }
    .practice-badge {
        background: #ede9fe !important;
        color: #5b21b6 !important;
        border: 1px solid #c4b5fd !important;
        box-shadow: 0 1px 3px rgba(91, 33, 182, 0.12);
    }
    .pyq-question {
        font-size: 1.05em;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.65;
        margin-bottom: 16px;
    }
    
    /* CLICKABLE INTERACTIVE OPTIONS */
    .pyq-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
        margin-bottom: 18px;
    }
    .pyq-opt {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 0.95em;
        color: #334155;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pyq-opt:hover {
        background: #f1f5f9;
        border-color: #6366f1;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
    }
    .pyq-opt:active {
        transform: scale(0.98);
    }
    .pyq-opt strong {
        color: #4f46e5 !important;
        font-weight: 800;
        font-size: 1.05em;
    }

    /* Option: Correct State */
    .pyq-opt.is-correct {
        background: #ecfdf5 !important;
        border-color: #10b981 !important;
        color: #065f46 !important;
        font-weight: 700;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.25) !important;
        transform: scale(1.02);
    }
    .pyq-opt.is-correct strong {
        color: #059669 !important;
    }
    .pyq-opt.is-correct::after {
        content: "✅ Correct!";
        position: absolute;
        right: 12px;
        background: #10b981;
        color: white;
        font-size: 0.75em;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 20px;
        animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    /* Option: Wrong / Mistake State */
    .pyq-opt.is-wrong {
        background: #fef2f2 !important;
        border-color: #ef4444 !important;
        color: #991b1b !important;
        font-weight: 700;
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.25) !important;
        animation: shake 0.3s ease-in-out;
    }
    .pyq-opt.is-wrong strong {
        color: #dc2626 !important;
    }
    .pyq-opt.is-wrong::after {
        content: "❌ Wrong!";
        position: absolute;
        right: 12px;
        background: #ef4444;
        color: white;
        font-size: 0.75em;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 20px;
        animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    /* Option: Revealed Correct State (When user picked wrong) */
    .pyq-opt.show-correct {
        border-color: #10b981 !important;
        background: #f0fdf4 !important;
        color: #166534 !important;
        font-weight: 700;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.2) !important;
    }
    .pyq-opt.show-correct::after {
        content: "⭐ Correct Answer";
        position: absolute;
        right: 12px;
        background: #16a34a;
        color: white;
        font-size: 0.72em;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 20px;
    }

    @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        80% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    .pyq-card-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 12px;
        border-top: 1px dashed #e2e8f0;
        padding-top: 12px;
        flex-wrap: wrap;
        gap: 10px;
    }

    .pyq-details {
        flex-grow: 1;
    }
    summary.pyq-toggle-btn {
        list-style: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #f0fdf4;
        color: #166534;
        border: 1.5px solid #bbf7d0;
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 0.88em;
        font-weight: 700;
        font-family: inherit;
        transition: all 0.2s ease;
        user-select: none;
    }
    summary.pyq-toggle-btn::-webkit-details-marker {
        display: none;
    }
    summary.pyq-toggle-btn:hover {
        background: #dcfce7;
        border-color: #86efac;
        box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);
    }
    .pyq-details[open] summary.pyq-toggle-btn {
        background: #e0e7ff;
        color: #3730a3;
        border-color: #c7d2fe;
    }
    
    .pyq-reset-btn {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 0.84em;
        font-weight: 700;
        cursor: pointer;
        display: none;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
    }
    .pyq-reset-btn:hover {
        background: #e2e8f0;
        color: #0f172a;
    }

    .pyq-solution {
        margin-top: 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px 20px;
        animation: fadeIn 0.25s ease-in-out;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .pyq-ans-badge {
        display: inline-block;
        background: #dcfce7;
        color: #15803d;
        border: 1px solid #86efac;
        font-weight: 800;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.92em;
        margin-bottom: 10px;
    }
    .pyq-ans-badge strong {
        color: #15803d !important;
    }
    .pyq-explanation {
        font-size: 0.94em;
        line-height: 1.7;
        color: #334155;
    }

    /* Tables */
    .markdown-body table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 25px 0; 
        box-shadow: 0 4px 14px rgba(0,0,0,0.05); 
        border-radius: 8px;
        overflow: hidden;
    }
    .markdown-body table th { 
        background: linear-gradient(135deg, #0d47a1, #1976d2); 
        color: white; 
        font-size: 1.02em; 
        padding: 12px 14px; 
        text-align: left; 
        font-family: 'Outfit', sans-serif;
    }
    .markdown-body table td { 
        font-size: 0.96em; 
        padding: 11px 14px; 
        border-bottom: 1px solid #e2e8f0; 
    }
    .markdown-body table tr:nth-child(even) { background-color: #f8fafc; }
    
    /* Lists and points */
    .markdown-body ul { list-style-type: disc; padding-left: 24px; line-height: 1.8;}
    .markdown-body li { margin-bottom: 8px; }
    
    /* PYQ Badges */
    .pyq-tag {
        background-color: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fca5a5;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.82em;
        font-weight: 700;
        display: inline-block;
        margin-left: 6px;
    }

    /* Floating Jump Button */
    .floating-top-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--primary-color);
        color: white;
        border: none;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        box-shadow: 0 6px 18px rgba(139, 0, 0, 0.35);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3em;
        z-index: 999;
        transition: all 0.2s ease;
        opacity: 0;
        pointer-events: none;
    }
    .floating-top-btn.visible {
        opacity: 1;
        pointer-events: auto;
    }
    .floating-top-btn:hover {
        background: var(--primary-dark);
        transform: translateY(-3px) scale(1.05);
    }
</style>
</head>
<body>
    <!-- Reading Progress Bar -->
    <div id="progress-bar"></div>

    <!-- Fireworks & Confetti Canvas Overlay -->
    <canvas id="fireworks-canvas"></canvas>

    <!-- THE SINGLE UNIFIED STICKY TOP NAVIGATION BAR -->
    <div class="sticky-navbar">
        <a href="#top" class="nav-brand">
            <span>🏰 Rajasthan History & Culture</span>
            <span class="nav-brand-badge">RPSC / RAS / EO-RO</span>
        </a>
        <div class="nav-actions">
            <select class="chapter-select-dropdown" id="chapterSelector" onchange="jumpToChapter(this.value)">
                <option value="" disabled selected>⚡ Jump to Chapter...</option>
                <option value="chapter-1">Ch 1: History of Rajasthan (इतिहास)</option>
                <option value="chapter-2">Ch 2: Saints & Folk Deities (संत एवं लोक देवता)</option>
                <option value="chapter-3">Ch 3: Festivals & Fairs (त्यौहार एवं मेले)</option>
                <option value="chapter-4">Ch 4: Costumes & Ornaments (वेशभूषा एवं आभूषण)</option>
                <option value="chapter-5">Ch 5: Paintings & Folk Arts (चित्रकला एवं हस्तकला)</option>
                <option value="chapter-6">Ch 6: Architecture & Forts (स्थापत्य एवं दुर्ग)</option>
                <option value="chapter-7">Ch 7: Music, Dance & Drama (संगीत, नृत्य एवं नाट्य)</option>
                <option value="chapter-8">Ch 8: Musical Instruments (लोक वाद्य यंत्र)</option>
                <option value="chapter-9">Ch 9: Language & Literature (भाषा एवं साहित्य)</option>
                <option value="chapter-10">Ch 10: Tourist Destinations (पर्यटन स्थल)</option>
                <option value="chapter-11">Ch 11: Personalities & Freedom Fighters (व्यक्तित्व)</option>
            </select>
            <a href="../part_b/preview.html" class="nav-btn-partb">📘 Part B: Act 2009</a>
        </div>
    </div>

    <div class="container" id="top">
        <div class="markdown-body">
            ${htmlBody}
        </div>
    </div>

    <!-- Floating Back to Top Button -->
    <button class="floating-top-btn" id="scrollTopBtn" onclick="scrollToTop()" title="Back to top">↑</button>

    <script>
        // ==========================================================
        // 1. Reading Progress Indicator & Scroll-to-top visibility
        // ==========================================================
        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            document.getElementById('progress-bar').style.width = scrolled + '%';

            const topBtn = document.getElementById('scrollTopBtn');
            if (winScroll > 350) {
                topBtn.classList.add('visible');
            } else {
                topBtn.classList.remove('visible');
            }
        });

        // Jump to chapter helper with exact offset
        function jumpToChapter(chapterId) {
            if (!chapterId) return;
            const target = document.getElementById(chapterId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.hash = '#' + chapterId;
            }
        }

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Active Chapter Sync in Dropdown on scroll
        document.addEventListener('DOMContentLoaded', () => {
            const chapterHeaders = document.querySelectorAll('.chapter-header');
            const dropdown = document.getElementById('chapterSelector');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const chNum = entry.target.getAttribute('data-chapter');
                        if (dropdown) {
                            dropdown.value = 'chapter-' + chNum;
                        }
                    }
                });
            }, { rootMargin: '-10% 0px -75% 0px' });

            chapterHeaders.forEach(header => observer.observe(header));
        });

        // ==========================================================
        // 2. AUDIO SYNTHESIZER (Web Audio API - No external assets)
        // ==========================================================
        let audioCtx = null;
        function getAudioContext() {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) audioCtx = new AudioContextClass();
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        }

        // Victory Chime for Correct Answer
        function playVictorySound() {
            try {
                const ctx = getAudioContext();
                if (!ctx) return;
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, index) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
                    gain.gain.setValueAtTime(0.18, ctx.currentTime + index * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + index * 0.08);
                    osc.stop(ctx.currentTime + index * 0.08 + 0.38);
                });
            } catch (e) {
                // Ignore audio restriction
            }
        }

        // Warning Siren / Alarm for Wrong Answer
        function playSirenSound() {
            try {
                const ctx = getAudioContext();
                if (!ctx) return;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                
                // Frequency oscillation for siren effect (440Hz down to 220Hz and back)
                osc.frequency.setValueAtTime(450, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.22);
                osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.44);

                gain.gain.setValueAtTime(0.20, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.48);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
            } catch (e) {
                // Ignore audio restriction
            }
        }

        // ==========================================================
        // 3. CRACKERS & CONFETTI PARTY POPPER CANVAS ENGINE
        // ==========================================================
        const canvas = document.getElementById('fireworks-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId = null;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 3;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed - 2;
                this.gravity = 0.22;
                this.alpha = 1;
                this.decay = Math.random() * 0.018 + 0.012;
                this.size = Math.random() * 7 + 4;
                this.isStar = Math.random() > 0.5;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.2;
            }
            update() {
                this.vx *= 0.98;
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;
                this.alpha -= this.decay;
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = Math.max(0, this.alpha);
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.color;
                if (this.isStar) {
                    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        function triggerFirecrackerBurst(originX, originY) {
            const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#fbbf24', '#ffffff'];
            // Create 90 festive particles radiating from origin
            for (let i = 0; i < 90; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(originX, originY, color));
            }
            if (!animationFrameId) {
                animateParticles();
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].alpha <= 0) {
                    particles.splice(i, 1);
                }
            }
            if (particles.length > 0) {
                animationFrameId = requestAnimationFrame(animateParticles);
            } else {
                animationFrameId = null;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Helper to normalize keys (A, B, C, D or 1, 2, 3, 4)
        function normalizeKey(str) {
            if (!str) return '';
            const trimmed = str.trim().toUpperCase();
            if (trimmed === '1') return 'A';
            if (trimmed === '2') return 'B';
            if (trimmed === '3') return 'C';
            if (trimmed === '4') return 'D';
            return trimmed;
        }

        // ==========================================================
        // 4. INTERACTIVE QUIZ OPTION ENGINE FOR ALL PYQs & PRACTICE MCQs
        // ==========================================================
        document.addEventListener('DOMContentLoaded', () => {
            const pyqCards = document.querySelectorAll('.pyq-card');

            pyqCards.forEach((card) => {
                const options = card.querySelectorAll('.pyq-opt');
                const correctKey = (card.getAttribute('data-correct') || 'A').trim().toUpperCase();
                const detailsElem = card.querySelector('.pyq-details');
                if (!options.length) return;

                // Insert feedback banner before question
                const questionElem = card.querySelector('.pyq-question');
                let feedbackBanner = card.querySelector('.pyq-feedback-banner');
                if (!feedbackBanner && questionElem) {
                    feedbackBanner = document.createElement('div');
                    feedbackBanner.className = 'pyq-feedback-banner';
                    questionElem.parentNode.insertBefore(feedbackBanner, questionElem);
                }

                // Add Reset Button to Card Controls
                let controlsWrapper = card.querySelector('.pyq-card-controls');
                if (!controlsWrapper && detailsElem) {
                    controlsWrapper = document.createElement('div');
                    controlsWrapper.className = 'pyq-card-controls';
                    detailsElem.parentNode.insertBefore(controlsWrapper, detailsElem);
                    controlsWrapper.appendChild(detailsElem);

                    const resetBtn = document.createElement('button');
                    resetBtn.className = 'pyq-reset-btn';
                    resetBtn.innerHTML = '🔄 Re-attempt';
                    resetBtn.onclick = () => resetCard(card, options, feedbackBanner, resetBtn, detailsElem);
                    controlsWrapper.appendChild(resetBtn);
                }

                // Attach click handlers to options
                options.forEach((opt) => {
                    const optKey = (opt.getAttribute('data-opt') || 'A').trim().toUpperCase();

                    opt.addEventListener('click', (e) => {
                        handleOptionClick(e, card, opt, optKey, correctKey, options, feedbackBanner, detailsElem);
                    });
                });
            });

            function handleOptionClick(e, card, clickedOpt, optKey, correctKey, allOptions, banner, detailsElem) {
                // If card is already answered in correct state, return
                if (card.classList.contains('celebrate-active')) return;

                const resetBtn = card.querySelector('.pyq-reset-btn');
                if (resetBtn) resetBtn.style.display = 'inline-flex';

                // Reset previous card states
                card.classList.remove('siren-active', 'celebrate-active');
                allOptions.forEach(o => o.classList.remove('is-correct', 'is-wrong', 'show-correct'));

                const isCorrect = (optKey === correctKey);

                if (isCorrect) {
                    // 🌟 CORRECT ANSWER TRIGGER!
                    clickedOpt.classList.add('is-correct');
                    card.classList.add('celebrate-active');

                    if (banner) {
                        banner.className = 'pyq-feedback-banner success';
                        banner.innerHTML = '<span>🎉</span><span><strong>Brilliant! Correct Answer (' + optKey + ')!</strong> Crackers & poppers unlocked! Great retention.</span>';
                    }

                    // Play celebration sound & burst crackers
                    playVictorySound();
                    const rect = clickedOpt.getBoundingClientRect();
                    const burstX = rect.left + rect.width / 2;
                    const burstY = rect.top + rect.height / 2;
                    triggerFirecrackerBurst(burstX, burstY);

                    // Auto-open solution explanation
                    if (detailsElem) detailsElem.setAttribute('open', 'true');

                } else {
                    // 🚨 WRONG ANSWER TRIGGER (SIREN & WARNING)!
                    clickedOpt.classList.add('is-wrong');
                    card.classList.add('siren-active');

                    if (banner) {
                        banner.className = 'pyq-feedback-banner error';
                        banner.innerHTML = '<span>🚨</span><span><strong>Siren Alert! Incorrect Option (' + optKey + ')!</strong> The correct answer is <strong>(' + correctKey + ')</strong>. Review the explanation below.</span>';
                    }

                    // Play warning siren sound
                    playSirenSound();

                    // Highlight the true correct option in glowing green
                    allOptions.forEach(o => {
                        const k = (o.getAttribute('data-opt') || '').trim().toUpperCase();
                        if (k === correctKey) {
                            o.classList.add('show-correct');
                        }
                    });

                    // Auto-open solution explanation so student immediately learns
                    if (detailsElem) detailsElem.setAttribute('open', 'true');
                }
            }

            function resetCard(card, allOptions, banner, resetBtn, detailsElem) {
                card.classList.remove('siren-active', 'celebrate-active');
                allOptions.forEach(o => o.classList.remove('is-correct', 'is-wrong', 'show-correct'));
                if (banner) {
                    banner.className = 'pyq-feedback-banner';
                    banner.innerHTML = '';
                }
                if (resetBtn) resetBtn.style.display = 'none';
                if (detailsElem) detailsElem.removeAttribute('open');
            }
        });
    </script>
</body>
</html>`;

// Write HTML to file
fs.writeFileSync(htmlOutputFile, fullHtml);

console.log('history_preview.html regenerated with Interactive MCQ Options, Crackers/Poppers burst, and Emergency Siren animations!');
