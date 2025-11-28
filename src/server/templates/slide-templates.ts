// ~/server/templates/slide-templates.ts

export interface SlideTemplate {
    id: string
    name: string
    description: string
    theme: 'dark' | 'light' | 'gradient' | 'minimal' | 'modern'
    layouts: LayoutTemplate[]
    cssVariables: Record<string, string>
  }
  
  export interface LayoutTemplate {
    id: string
    name: string
    description: string
    htmlStructure: (title: string, content: string[], notes?: string) => string
    category: 'title-only' | 'title-content' | 'two-column' | 'title-image' | 'centered' | 'list'
  }
  
  // Template 1: Dark Mode Premium
  export const DARK_PREMIUM: SlideTemplate = {
    id: 'dark-premium',
    name: 'Dark Premium',
    description: 'Design escuro sofisticado com gradientes vibrantes',
    theme: 'dark',
    cssVariables: {
      '--bg-primary': '#0f1419',
      '--bg-secondary': '#1a1f2e',
      '--text-primary': '#ffffff',
      '--text-secondary': '#b0b8c1',
      '--accent-1': '#7c5cff',
      '--accent-2': '#00d9ff',
      '--accent-3': '#ff006e',
    },
    layouts: [
      {
        id: 'title-centered',
        name: 'Title Centered',
        description: 'Título centralizado com destaque',
        category: 'title-only',
        htmlStructure: (title: string) => `
          <div class="layout-title-centered">
            <div class="title-wrapper">
              <h1 class="slide-title">${title}</h1>
              <div class="title-underline"></div>
            </div>
          </div>
        `,
      },
      {
        id: 'title-content-left',
        name: 'Content Left',
        description: 'Título e conteúdo à esquerda',
        category: 'title-content',
        htmlStructure: (title: string, content: string[]) => `
          <div class="layout-content-left">
            <div class="content-wrapper">
              <h2 class="slide-title">${title}</h2>
              <ul class="content-list">
                ${content.map(item => `<li class="list-item">${item}</li>`).join('')}
              </ul>
            </div>
            <div class="accent-shape"></div>
          </div>
        `,
      },
      {
        id: 'two-column-split',
        name: 'Two Column Split',
        description: 'Conteúdo em duas colunas',
        category: 'two-column',
        htmlStructure: (title: string, content: string[]) => `
          <div class="layout-two-column">
            <h2 class="slide-title">${title}</h2>
            <div class="columns">
              <div class="column left">
                ${content[0] ? `<p>${content[0]}</p>` : ''}
                ${content[1] ? `<p>${content[1]}</p>` : ''}
              </div>
              <div class="column right">
                ${content[2] ? `<p>${content[2]}</p>` : ''}
                ${content[3] ? `<p>${content[3]}</p>` : ''}
              </div>
            </div>
          </div>
        `,
      },
    ],
  }
  
  // Template 2: Gradient Modern
  export const GRADIENT_MODERN: SlideTemplate = {
    id: 'gradient-modern',
    name: 'Gradient Modern',
    description: 'Design moderno com gradientes dinâmicos',
    theme: 'gradient',
    cssVariables: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f5f7fa',
      '--text-primary': '#1a202c',
      '--text-secondary': '#718096',
      '--accent-1': '#6366f1',
      '--accent-2': '#ec4899',
      '--accent-3': '#14b8a6',
    },
    layouts: [
      {
        id: 'hero-title',
        name: 'Hero Title',
        description: 'Título em estilo herói com background gradiente',
        category: 'title-only',
        htmlStructure: (title: string) => `
          <div class="layout-hero">
            <div class="hero-background"></div>
            <h1 class="hero-title">${title}</h1>
          </div>
        `,
      },
      {
        id: 'content-right',
        name: 'Content Right',
        description: 'Conteúdo à direita com visual limpo',
        category: 'title-content',
        htmlStructure: (title: string, content: string[]) => `
          <div class="layout-content-right">
            <div class="gradient-accent"></div>
            <div class="content-section">
              <h2 class="slide-title">${title}</h2>
              <div class="content-items">
                ${content.map(item => `
                  <div class="content-item">
                    <div class="item-bullet"></div>
                    <span>${item}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `,
      },
      {
        id: 'list-decorated',
        name: 'Decorated List',
        description: 'Lista decorada com ícones',
        category: 'list',
        htmlStructure: (title: string, content: string[]) => `
          <div class="layout-list-decorated">
            <h2 class="slide-title">${title}</h2>
            <ul class="decorated-list">
              ${content.map((item, idx) => `
                <li class="decorated-item" style="animation-delay: ${idx * 0.1}s">
                  <div class="item-number">${idx + 1}</div>
                  <span class="item-text">${item}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `,
      },
    ],
  }
  
  // Template 3: Minimal Clean
  export const MINIMAL_CLEAN: SlideTemplate = {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Design minimalista e limpo',
    theme: 'minimal',
    cssVariables: {
      '--bg-primary': '#fafafa',
      '--bg-secondary': '#f0f0f0',
      '--text-primary': '#000000',
      '--text-secondary': '#666666',
      '--accent-1': '#000000',
      '--accent-2': '#cccccc',
      '--accent-3': '#333333',
    },
    layouts: [
      {
        id: 'minimal-title',
        name: 'Minimal Title',
        description: 'Título minimalista puro',
        category: 'title-only',
        htmlStructure: (title: string) => `
          <div class="layout-minimal-title">
            <h1 class="minimal-title">${title}</h1>
            <div class="minimal-line"></div>
          </div>
        `,
      },
      {
        id: 'content-simple',
        name: 'Simple Content',
        description: 'Conteúdo simples e elegante',
        category: 'title-content',
        htmlStructure: (title: string, content: string[]) => `
          <div class="layout-content-simple">
            <h2 class="slide-title">${title}</h2>
            <div class="content-area">
              ${content.map(item => `<p class="content-text">${item}</p>`).join('')}
            </div>
          </div>
        `,
      },
    ],
  }
  
  // Template 4: Corporate Professional
  export const CORPORATE_PROFESSIONAL: SlideTemplate = {
    id: 'corporate-pro',
    name: 'Corporate Professional',
    description: 'Design corporativo e profissional',
    theme: 'dark',
    cssVariables: {
      '--bg-primary': '#1e3a5f',
      '--bg-secondary': '#2d4a73',
      '--text-primary': '#ffffff',
      '--text-secondary': '#b8c5d6',
      '--accent-1': '#3b82f6',
      '--accent-2': '#1e40af',
      '--accent-3': '#93c5fd',
    },
    layouts: [
      {
        id: 'corporate-title',
        name: 'Corporate Title',
        description: 'Título corporativo',
        category: 'title-only',
        htmlStructure: (title: string) => `
          <div class="layout-corporate-title">
            <div class="corporate-header">
              <div class="header-bar"></div>
              <h1 class="corporate-title">${title}</h1>
            </div>
          </div>
        `,
      },
      {
        id: 'corporate-content',
        name: 'Corporate Content',
        description: 'Conteúdo corporativo estruturado',
        category: 'title-content',
        htmlStructure: (title: string, content: string[]) => `
          <div class="layout-corporate-content">
            <div class="content-header">
              <div class="header-accent"></div>
              <h2 class="slide-title">${title}</h2>
            </div>
            <div class="corporate-list">
              ${content.map(item => `
                <div class="corporate-item">
                  <span class="item-bullet">▸</span>
                  <span>${item}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `,
      },
    ],
  }
  
  // Todos os templates disponíveis
  export const ALL_TEMPLATES: SlideTemplate[] = [
    DARK_PREMIUM,
    GRADIENT_MODERN,
    MINIMAL_CLEAN,
    CORPORATE_PROFESSIONAL,
  ]
  
  // Função para gerar CSS completo do template
  export function generateTemplateCss(template: SlideTemplate): string {
    const cssVariables = Object.entries(template.cssVariables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ')
  
    const commonCss = `
      :root {
        ${cssVariables}
      }
  
      * {
        box-sizing: border-box;
      }
  
      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
  
      .slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
        z-index: 1;
        opacity: 0;
        visibility: hidden;
        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
  
      .slide.active {
        z-index: 10;
        opacity: 1;
        visibility: visible;
      }
  
      .slide-title {
        font-size: 3rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
        line-height: 1.2;
      }
  
      /* Template Específico: Dark Premium */
      .layout-title-centered {
        width: 100%;
        text-align: center;
      }
  
      .title-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
      }
  
      .title-underline {
        width: 150px;
        height: 6px;
        background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
        border-radius: 3px;
      }
  
      .layout-content-left {
        display: flex;
        align-items: center;
        gap: 4rem;
        width: 100%;
      }
  
      .content-wrapper {
        flex: 1;
      }
  
      .content-list {
        list-style: none;
        padding: 0;
        margin: 2rem 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
  
      .list-item {
        font-size: 1.4rem;
        color: var(--text-secondary);
        padding-left: 2rem;
        position: relative;
      }
  
      .list-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.5rem;
        width: 8px;
        height: 8px;
        background: var(--accent-2);
        border-radius: 50%;
      }
  
      .accent-shape {
        width: 400px;
        height: 400px;
        background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
        border-radius: 50%;
        opacity: 0.15;
        animation: float 6s ease-in-out infinite;
      }
  
      .layout-two-column {
        width: 100%;
      }
  
      .columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        margin-top: 2rem;
      }
  
      .column {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
  
      .column p {
        font-size: 1.2rem;
        line-height: 1.8;
        color: var(--text-secondary);
      }
  
      /* Template Específico: Gradient Modern */
      .layout-hero {
        position: relative;
        width: 100%;
        text-align: center;
        z-index: 1;
      }
  
      .hero-background {
        position: absolute;
        inset: -60px;
        background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
        z-index: -1;
        opacity: 0.2;
        border-radius: 30px;
      }
  
      .hero-title {
        font-size: 4rem;
        background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
  
      .layout-content-right {
        width: 100%;
        position: relative;
      }
  
      .gradient-accent {
        position: absolute;
        top: -100px;
        right: -200px;
        width: 500px;
        height: 500px;
        background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
        border-radius: 50%;
        opacity: 0.1;
        z-index: 0;
      }
  
      .content-section {
        position: relative;
        z-index: 1;
      }
  
      .content-items {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        margin-top: 2rem;
      }
  
      .content-item {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        font-size: 1.3rem;
        color: var(--text-secondary);
      }
  
      .item-bullet {
        width: 12px;
        height: 12px;
        background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
        border-radius: 50%;
        flex-shrink: 0;
      }
  
      .layout-list-decorated {
        width: 100%;
      }
  
      .decorated-list {
        list-style: none;
        padding: 0;
        margin: 2rem 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
  
      .decorated-item {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        animation: slideIn 0.6s ease-out forwards;
        opacity: 0;
      }
  
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
  
      .item-number {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.3rem;
        flex-shrink: 0;
      }
  
      .item-text {
        font-size: 1.4rem;
        color: var(--text-secondary);
      }
  
      /* Template Específico: Minimal Clean */
      .layout-minimal-title {
        text-align: center;
        width: 100%;
      }
  
      .minimal-title {
        font-size: 3.5rem;
        font-weight: 300;
        letter-spacing: 2px;
      }
  
      .minimal-line {
        width: 100px;
        height: 2px;
        background: var(--accent-1);
        margin: 2rem auto 0;
      }
  
      .layout-content-simple {
        width: 100%;
        max-width: 900px;
      }
  
      .content-area {
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
  
      .content-text {
        font-size: 1.4rem;
        line-height: 1.8;
        margin: 0;
        font-weight: 300;
      }
  
      /* Template Específico: Corporate Professional */
      .layout-corporate-title {
        width: 100%;
      }
  
      .corporate-header {
        display: flex;
        align-items: center;
        gap: 2rem;
      }
  
      .header-bar {
        width: 8px;
        height: 120px;
        background: linear-gradient(180deg, var(--accent-1), var(--accent-3));
      }
  
      .corporate-title {
        font-size: 3.5rem;
        font-weight: 600;
        letter-spacing: 1px;
      }
  
      .layout-corporate-content {
        width: 100%;
      }
  
      .content-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
  
      .header-accent {
        width: 4px;
        height: 50px;
        background: var(--accent-1);
      }
  
      .corporate-list {
        display: flex;
        flex-direction: column;
        gap: 1.8rem;
      }
  
      .corporate-item {
        display: flex;
        align-items: flex-start;
        gap: 1.5rem;
        font-size: 1.3rem;
        color: var(--text-secondary);
      }
  
      .corporate-item .item-bullet {
        color: var(--accent-1);
        font-weight: bold;
        margin-top: 0.2rem;
      }
  
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-20px);
        }
      }
  
      @media (max-width: 1024px) {
        .slide {
          padding: 40px;
        }
  
        .slide-title {
          font-size: 2.5rem;
        }
  
        .columns {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
  
        .layout-content-left {
          flex-direction: column;
        }
  
        .accent-shape {
          width: 300px;
          height: 300px;
        }
      }
    `
  
    return commonCss
  }
  
  // Função para selecionar layout aleatório ou específico
  export function selectLayout(template: SlideTemplate, index: number): LayoutTemplate {
    const layoutIndex = index % template.layouts.length
    return template.layouts[layoutIndex]
  }
  
  // Função para renderizar slide com template
  export function renderSlideWithTemplate(
    title: string,
    content: string[],
    layout: LayoutTemplate,
    slideNumber: number,
  ): string {
    const htmlContent = layout.htmlStructure(title, content)
    return `<div id="slide${slideNumber}" class="slide">${htmlContent}</div>`
  }