import React, { useState } from 'react';
import { FullRepoResponse, ThemeStyle } from '../types';
import { Code2, Copy, Check, Share2, Layers, ShieldCheck, Terminal, FileCode, FileType, Braces, Package } from 'lucide-react';
import { generateDefaultUmlDiagram } from '../utils/umlGenerator';

interface EmbedCodeGeneratorProps {
  data: FullRepoResponse;
  activeTheme: ThemeStyle;
}

type EmbedType = 'iframe' | 'react' | 'tailwind' | 'markdown' | 'html' | 'css' | 'javascript' | 'combined';

// Safely escape a string for use inside HTML attribute values (double-quoted)
function escAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Safely escape a string for use inside HTML text content
function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Safely escape a string for use inside a JS string literal (single-quoted)
function escJs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/<\/script>/gi, '<\\/script>');
}

export const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({ data, activeTheme }) => {
  const { repo } = data;
  const [embedType, setEmbedType] = useState<EmbedType>('tailwind');
  const [copied, setCopied] = useState(false);

  // ── Existing snippet generators ──────────────────────────────────────────

  const getIframeCode = () => {
    return `<iframe\n  src="${window.location.origin}/embed?repo=${encodeURIComponent(repo.full_name)}&theme=${activeTheme}"\n  width="100%"\n  height="240"\n  style="border: none; border-radius: 12px; overflow: hidden;"\n  title="${escAttr(repo.full_name)} GitHub Showcase"\n></iframe>`;
  };

  const getReactCode = () => {
    const architectureDiagram = generateDefaultUmlDiagram(data);
    const languageEntries = Object.entries(data.languages)
      .sort(([, a], [, b]) => b - a)
      .map(([name, bytes]) => ({ name, bytes }));
    const treePaths = data.tree
      .map((item) => item.path)
      .filter((path) => !path.startsWith('.'))
      .slice(0, 24);

    const snippetData = {
      repo: {
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        ownerAvatarUrl: repo.owner.avatar_url,
        htmlUrl: repo.html_url,
        description: repo.description || '',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        primaryLanguage: repo.language || 'Repository',
        license: repo.license || 'Open Source',
        defaultBranch: repo.default_branch || 'main',
        topics: repo.topics.slice(0, 12),
      },
      languages: languageEntries,
      diagrams: {
        mermaidCode: architectureDiagram.mermaidCode || 'classDiagram\n  class Repository',
        plantUmlCode: architectureDiagram.plantUmlCode || '@startuml\nclass Repository\n@enduml',
        classes: architectureDiagram.classes.map((item) => ({
          id: item.id,
          name: item.name,
          stereotype: item.stereotype || 'class',
          packageName: item.packageName || '',
          attributes: item.attributes.map((attr) => `${attr.visibility || '+'}${attr.name}: ${attr.type}`),
          methods: item.methods.map((method) => `${method.visibility || '+'}${method.name}(${method.parameters || ''}): ${method.returnType}`),
        })),
        relationships: architectureDiagram.relationships.map((rel) => ({
          fromId: rel.fromId,
          toId: rel.toId,
          type: rel.type,
          label: rel.label || rel.type,
        })),
      },
      treePaths,
    };

    const serializedData = JSON.stringify(snippetData, null, 2);

    return `import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export function GitHubRepoCard({ renderWebArchitecture } = {}) {
  const data = ${serializedData};
  const [activeDiagram, setActiveDiagram] = useState('mermaid');
  const [mermaidError, setMermaidError] = useState('');
  const mermaidContainerRef = useRef(null);

  useEffect(() => {
    if (activeDiagram !== 'mermaid') return;
    let cancelled = false;

    const renderMermaid = async () => {
      if (!mermaidContainerRef.current) return;
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' });
        const renderId = 'repo-card-diagram-' + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(renderId, data.diagrams.mermaidCode);
        if (!cancelled && mermaidContainerRef.current) {
          setMermaidError('');
          mermaidContainerRef.current.innerHTML = svg;
          const svgEl = mermaidContainerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.display = 'block';
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMermaidError(error instanceof Error ? error.message : 'Unable to render Mermaid diagram.');
        }
      }
    };

    renderMermaid();
    return () => { cancelled = true; };
  }, [activeDiagram, data.diagrams.mermaidCode]);

  const totalLanguageBytes = useMemo(
    () => data.languages.reduce((sum, item) => sum + item.bytes, 0),
    []
  );

  return (
    <article className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 max-w-4xl shadow-xl space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={data.repo.ownerAvatarUrl} alt={data.repo.owner} className="w-10 h-10 rounded-xl border border-slate-700" />
          <div>
            <h3 className="font-bold text-base text-white">{data.repo.fullName}</h3>
            <p className="text-xs text-slate-400">{data.repo.owner}</p>
          </div>
        </div>
        <a
          href={data.repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
        >
          View Repo
        </a>
      </header>

      <p className="text-xs text-slate-300 leading-relaxed">{data.repo.description}</p>

      <div className="flex flex-wrap items-center gap-2">
        {data.repo.topics.map((topic) => (
          <span key={topic} className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 border border-slate-700 text-slate-300">
            #{topic}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">⭐ {data.repo.stars.toLocaleString()}</div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">🍴 {data.repo.forks.toLocaleString()}</div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">🐞 {data.repo.openIssues.toLocaleString()}</div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-indigo-300">{data.repo.primaryLanguage}</div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-white">Architecture Diagrams</h4>
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1 text-[11px]">
            {[
              ['mermaid', 'Mermaid'],
              ['web', 'Interactive Web'],
              ['plantuml', 'PlantUML'],
              ['specs', 'Class Inventory'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveDiagram(key)}
                className={\`px-2.5 py-1 rounded-md transition \${activeDiagram === key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeDiagram === 'mermaid' && (
          <div className="space-y-2">
            {mermaidError && (
              <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800 rounded-lg p-2">
                Mermaid render failed: {mermaidError}
              </p>
            )}
            <div ref={mermaidContainerRef} className="w-full overflow-x-auto rounded-lg border border-slate-700 bg-white text-slate-900 p-2" />
          </div>
        )}

        {activeDiagram === 'web' && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300 space-y-2">
            {typeof renderWebArchitecture === 'function' ? (
              renderWebArchitecture({
                classes: data.diagrams.classes,
                relationships: data.diagrams.relationships,
              })
            ) : (
              <>
                <p className="text-slate-200 font-medium">
                  Interactive Web Architecture hook is available.
                </p>
                <p>
                  Pass a renderWebArchitecture function prop to wire this tab to your interactive renderer (same architecture as this project’s WebArchitectureDiagram).
                </p>
              </>
            )}
          </div>
        )}

        {activeDiagram === 'plantuml' && (
          <pre className="text-[11px] text-emerald-200 bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto">
{data.diagrams.plantUmlCode}
          </pre>
        )}

        {activeDiagram === 'specs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.diagrams.classes.slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs">
                <p className="font-semibold text-slate-100">{item.name}</p>
                <p className="text-[11px] text-slate-400">{item.stereotype} · {item.packageName || 'root'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-white">Language Composition &amp; Tech Stack</h4>
        <div className="space-y-2">
          {data.languages.map((language) => {
            const pct = totalLanguageBytes > 0 ? Math.round((language.bytes / totalLanguageBytes) * 100) : 0;
            return (
              <div key={language.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{language.name}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: \`\${pct}%\` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300">Primary: {data.repo.primaryLanguage}</span>
          <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300">License: {data.repo.license}</span>
          <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300">Branch: {data.repo.defaultBranch}</span>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-white">Repository Structure ({data.repo.defaultBranch})</h4>
        <pre className="text-[11px] leading-relaxed text-slate-300 font-mono bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto">
{data.treePaths.map((path) => \`• \${path}\`).join('\\n')}
        </pre>
      </section>

      <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
        Exported from the GitHub Repository Showcase card generator.
      </div>
    </article>
  );
}`;
  };

  const getTailwindCode = () => {
    return `<!-- GitHub Repository Presentation Card -->
<div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 max-w-lg shadow-xl hover:border-indigo-500/40 transition-all">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <img src="${escAttr(repo.owner.avatar_url)}" alt="${escAttr(repo.owner.login)}" class="w-10 h-10 rounded-xl border border-slate-700" />
      <div>
        <a href="${escAttr(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="font-bold text-base text-white hover:underline">${escHtml(repo.full_name)}</a>
        <div class="text-xs text-slate-400">${escHtml(repo.language || 'Repository')} &bull; ${escHtml(repo.license || 'Open Source')}</div>
      </div>
    </div>
    <a href="${escAttr(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">View Repo</a>
  </div>
  <p class="text-xs text-slate-300 mt-3 leading-relaxed">${escHtml(repo.description || '')}</p>
  <div class="flex items-center gap-4 mt-4 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800/80">
    <span>⭐ ${repo.stargazers_count.toLocaleString()} stars</span>
    <span>🍴 ${repo.forks_count.toLocaleString()} forks</span>
  </div>
</div>`;
  };

  const getMarkdownCode = () => {
    return `[![${repo.full_name} GitHub Showcase](https://img.shields.io/github/stars/${repo.full_name}?style=for-the-badge&logo=github&color=6366f1)](https://github.com/${repo.full_name})
[![License](https://img.shields.io/github/license/${repo.full_name}?style=for-the-badge&color=10b981)](https://github.com/${repo.full_name})`;
  };

  // ── New standalone HTML/CSS/JS generators ────────────────────────────────

  const getHtmlCode = () => {
    return `<!-- GitHub Repository Card — plain HTML (link repo-card.css and repo-card.js) -->
<div class="repo-card" id="repo-card">
  <div class="repo-card__header">
    <img
      class="repo-card__avatar"
      src="${escAttr(repo.owner.avatar_url)}"
      alt="${escAttr(repo.owner.login)}"
    />
    <div class="repo-card__meta">
      <a
        class="repo-card__name"
        href="${escAttr(repo.html_url)}"
        target="_blank"
        rel="noopener noreferrer"
      >${escHtml(repo.full_name)}</a>
      <span class="repo-card__language">${escHtml(repo.language || 'Repository')}</span>
    </div>
    <a
      class="repo-card__btn"
      href="${escAttr(repo.html_url)}"
      target="_blank"
      rel="noopener noreferrer"
    >View Repo</a>
  </div>
  <p class="repo-card__description">${escHtml(repo.description || '')}</p>
  <div class="repo-card__stats">
    <span class="repo-card__stat">&#11088; <strong class="repo-card__stars">${repo.stargazers_count.toLocaleString()}</strong> stars</span>
    <span class="repo-card__stat">&#127860; <strong class="repo-card__forks">${repo.forks_count.toLocaleString()}</strong> forks</span>
    <span class="repo-card__stat">&#10007; <strong class="repo-card__issues">${repo.open_issues_count.toLocaleString()}</strong> issues</span>
  </div>
</div>`;
  };

  const getCssCode = () => {
    return `/* ── GitHub Repository Card ─────────────────────────────────────────── */
/* Drop this file alongside repo-card.html and repo-card.js             */

.repo-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  max-width: 480px;
  border-radius: 16px;
  background: #0f172a;
  border: 1px solid #1e293b;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif;
  font-size: 13px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.repo-card:hover {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 6px 32px rgba(99, 102, 241, 0.15);
}

/* Header ─────────────────────────────────────────────────────────────── */
.repo-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.repo-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.repo-card__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.repo-card__name {
  font-weight: 700;
  font-size: 14px;
  color: #f1f5f9;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.repo-card__name:hover {
  text-decoration: underline;
}

.repo-card__language {
  font-size: 11px;
  color: #94a3b8;
}

.repo-card__btn {
  flex-shrink: 0;
  padding: 6px 12px;
  background: #4f46e5;
  color: #fff;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease;
}

.repo-card__btn:hover {
  background: #6366f1;
}

/* Description ────────────────────────────────────────────────────────── */
.repo-card__description {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #cbd5e1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Stats ──────────────────────────────────────────────────────────────── */
.repo-card__stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #1e293b;
}

.repo-card__stat {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 11px;
  color: #94a3b8;
}

.repo-card__stat strong {
  color: #e2e8f0;
  font-weight: 600;
}

/* Light theme — add class="repo-card repo-card--light" for light mode ── */
.repo-card--light {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #1e293b;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.repo-card--light:hover {
  border-color: rgba(99, 102, 241, 0.4);
}

.repo-card--light .repo-card__name {
  color: #0f172a;
}

.repo-card--light .repo-card__language,
.repo-card--light .repo-card__stat {
  color: #64748b;
}

.repo-card--light .repo-card__stat strong {
  color: #1e293b;
}

.repo-card--light .repo-card__description {
  color: #334155;
}

.repo-card--light .repo-card__stats {
  border-top-color: #e2e8f0;
}

.repo-card--light .repo-card__avatar {
  border-color: #cbd5e1;
}`;
  };

  const getJsCode = () => {
    return `/**
 * GitHub Repository Card — Vanilla JS
 * ─────────────────────────────────────────────────────────────────────────
 * Usage:
 *   1. Add <div id="repo-card"></div> (or any element with data-repo) to
 *      your page and include this script.
 *   2. Optionally pass a GitHub repo slug to renderRepoCard() to fetch
 *      live data and inject it into the card.
 *
 * The card HTML + CSS selectors match repo-card.html / repo-card.css.
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* Default data baked in at export time ---------------------------------- */
  var REPO_DATA = {
    full_name:        '${escJs(repo.full_name)}',
    name:             '${escJs(repo.name)}',
    html_url:         '${escJs(repo.html_url)}',
    description:      '${escJs(repo.description || '')}',
    owner_login:      '${escJs(repo.owner.login)}',
    owner_avatar_url: '${escJs(repo.owner.avatar_url)}',
    language:         '${escJs(repo.language || '')}',
    stargazers_count: ${repo.stargazers_count},
    forks_count:      ${repo.forks_count},
    open_issues_count:${repo.open_issues_count},
  };

  /* Helpers ---------------------------------------------------------------- */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtNum(n) {
    return Number(n).toLocaleString();
  }

  /* Render ----------------------------------------------------------------- */
  function renderCard(el, d) {
    el.className = 'repo-card';
    el.innerHTML =
      '<div class="repo-card__header">' +
        '<img class="repo-card__avatar" src="' + esc(d.owner_avatar_url) + '" alt="' + esc(d.owner_login) + '" />' +
        '<div class="repo-card__meta">' +
          '<a class="repo-card__name" href="' + esc(d.html_url) + '" target="_blank" rel="noopener noreferrer">' + esc(d.full_name) + '</a>' +
          '<span class="repo-card__language">' + esc(d.language || 'Repository') + '</span>' +
        '</div>' +
        '<a class="repo-card__btn" href="' + esc(d.html_url) + '" target="_blank" rel="noopener noreferrer">View Repo</a>' +
      '</div>' +
      '<p class="repo-card__description">' + esc(d.description) + '</p>' +
      '<div class="repo-card__stats">' +
        '<span class="repo-card__stat">&#11088; <strong class="repo-card__stars">' + fmtNum(d.stargazers_count) + '</strong> stars</span>' +
        '<span class="repo-card__stat">&#127860; <strong class="repo-card__forks">' + fmtNum(d.forks_count) + '</strong> forks</span>' +
        '<span class="repo-card__stat">&#10007; <strong class="repo-card__issues">' + fmtNum(d.open_issues_count) + '</strong> issues</span>' +
      '</div>';
  }

  /**
   * Fetch live GitHub API data and re-render the card.
   * @param {string} repoSlug  e.g. "owner/repo"
   * @param {string} [selector] CSS selector for the card element (default: "#repo-card")
   */
  function renderRepoCard(repoSlug, selector) {
    var el = document.querySelector(selector || '#repo-card');
    if (!el) return;

    // Render immediately with baked-in data while fetching
    renderCard(el, REPO_DATA);

    fetch('https://api.github.com/repos/' + encodeURIComponent(repoSlug))
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API error ' + res.status);
        return res.json();
      })
      .then(function (r) {
        renderCard(el, {
          full_name:         r.full_name        || repoSlug,
          name:              r.name             || repoSlug,
          html_url:          r.html_url         || '',
          description:       r.description      || '',
          owner_login:       (r.owner && r.owner.login)      || '',
          owner_avatar_url:  (r.owner && r.owner.avatar_url) || '',
          language:          r.language         || '',
          stargazers_count:  r.stargazers_count  || 0,
          forks_count:       r.forks_count       || 0,
          open_issues_count: r.open_issues_count || 0,
        });
      })
      .catch(function (err) {
        console.warn('[repo-card] Could not fetch live data:', err);
      });
  }

  /* Auto-init -------------------------------------------------------------- */
  // Render all elements that carry data-repo="owner/repo"
  document.querySelectorAll('[data-repo]').forEach(function (el) {
    renderRepoCard(el.getAttribute('data-repo'), null);
    // Override selector to target this specific element
    el.id = el.id || 'repo-card';
  });

  // Also render the default #repo-card if it exists and has no data-repo
  var defaultEl = document.getElementById('repo-card');
  if (defaultEl && !defaultEl.getAttribute('data-repo')) {
    renderCard(defaultEl, REPO_DATA);
  }

  /* Public API ------------------------------------------------------------- */
  window.RepoCard = { render: renderRepoCard };
}());`;
  };

  const getCombinedCode = () => {
    const css = getCssCode();
    const js = getJsCode();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(repo.full_name)} — Repository Card</title>
  <style>
/* ── Reset ────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020617;
  padding: 32px 16px;
}

${css}
  </style>
</head>
<body>

  <!--
    GitHub Repository Card — Self-contained embed
    ─────────────────────────────────────────────
    • Copy this entire file and open it in any browser, or paste the
      <div> and the <style>/<script> blocks into your own page.
    • To display a different repo, change data-repo below.
    • Live data is fetched from the GitHub API automatically.
  -->
  <div id="repo-card" data-repo="${escAttr(repo.full_name)}"></div>

  <script>
${js}
  </script>

</body>
</html>`;
  };

  const getCurrentSnippet = (): string => {
    switch (embedType) {
      case 'iframe':      return getIframeCode();
      case 'react':       return getReactCode();
      case 'tailwind':    return getTailwindCode();
      case 'markdown':    return getMarkdownCode();
      case 'html':        return getHtmlCode();
      case 'css':         return getCssCode();
      case 'javascript':  return getJsCode();
      case 'combined':    return getCombinedCode();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tab group definitions to keep the UI organised
  const tabs: { id: EmbedType; label: string }[] = [
    { id: 'combined',   label: 'Combined (HTML + CSS + JS)' },
    { id: 'html',       label: 'HTML' },
    { id: 'css',        label: 'CSS' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'tailwind',   label: 'HTML / Tailwind' },
    { id: 'react',      label: 'React (JSX)' },
    { id: 'iframe',     label: 'iFrame' },
    { id: 'markdown',   label: 'Markdown Badges' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Embed &amp; Export Code Snippet
            </h3>
            <p className="text-xs text-slate-400">
              Copy production-ready code to present this repository on your website or portfolio.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Snippet</span>
            </>
          )}
        </button>
      </div>

      {/* Snippet Format Selector */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setEmbedType(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              embedType === tab.id
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mode description hints */}
      {embedType === 'html' && (
        <p className="text-xs text-slate-500">
          Semantic HTML markup for the card. Pair with the <strong className="text-slate-400">CSS</strong> and <strong className="text-slate-400">JavaScript</strong> exports, or use the <strong className="text-slate-400">Combined</strong> export for a single self-contained file.
        </p>
      )}
      {embedType === 'css' && (
        <p className="text-xs text-slate-500">
          Standalone stylesheet for the card. Save as <code className="text-slate-400">repo-card.css</code> and link it from your page.
        </p>
      )}
      {embedType === 'javascript' && (
        <p className="text-xs text-slate-500">
          Vanilla JS widget. Renders the card with baked-in data and optionally fetches live stats from the GitHub API. Save as <code className="text-slate-400">repo-card.js</code>.
        </p>
      )}
      {embedType === 'combined' && (
        <p className="text-xs text-slate-500">
          A fully self-contained HTML page — includes inline CSS and JS. Open it directly in a browser or paste the relevant blocks into your own page. No build tools, no framework, no CDN required.
        </p>
      )}

      {/* Code Display Area */}
      <div className="relative">
        <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {getCurrentSnippet()}
        </pre>
      </div>
    </div>
  );
};
