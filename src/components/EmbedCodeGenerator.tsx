import React, { useState } from 'react';
import { FullRepoResponse, ThemeStyle } from '../types';
import { Code2, Copy, Check, Share2, Layers, ShieldCheck, Terminal } from 'lucide-react';

interface EmbedCodeGeneratorProps {
  data: FullRepoResponse;
  activeTheme: ThemeStyle;
}

export const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({ data, activeTheme }) => {
  const { repo } = data;
  const [embedType, setEmbedType] = useState<'iframe' | 'react' | 'tailwind' | 'markdown'>('tailwind');
  const [copied, setCopied] = useState(false);

  // Generate code snippets for each format
  const getIframeCode = () => {
    return `<iframe\n  src="${window.location.origin}/embed?repo=${encodeURIComponent(repo.full_name)}&theme=${activeTheme}"\n  width="100%"\n  height="240"\n  style="border: none; border-radius: 12px; overflow: hidden;"\n  title="${repo.full_name} GitHub Showcase"\n></iframe>`;
  };

  const getReactCode = () => {
    return `import React from 'react';\n\nexport function GitHubRepoCard() {\n  return (\n    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 max-w-md shadow-xl">\n      <div className="flex items-center gap-3">\n        <img src="${repo.owner.avatar_url}" alt="${repo.owner.login}" className="w-10 h-10 rounded-xl" />\n        <div>\n          <h3 className="font-bold text-base text-white">${repo.name}</h3>\n          <p className="text-xs text-slate-400">${repo.owner.login}</p>\n        </div>\n      </div>\n      <p className="text-xs text-slate-300 mt-2.5 line-clamp-2">${repo.description || ''}</p>\n      <div className="flex items-center justify-between mt-4 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800">\n        <span>⭐ ${repo.stargazers_count.toLocaleString()}</span>\n        <span>🍴 ${repo.forks_count.toLocaleString()}</span>\n        <span className="text-indigo-400 font-semibold">${repo.language || 'Code'}</span>\n      </div>\n    </div>\n  );\n}`;
  };

  const getTailwindCode = () => {
    return `<!-- GitHub Repository Presentation Card -->\n<div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 max-w-lg shadow-xl hover:border-indigo-500/40 transition-all">\n  <div className="flex items-center justify-between">\n    <div className="flex items-center gap-3">\n      <img src="${repo.owner.avatar_url}" alt="${repo.owner.login}" className="w-10 h-10 rounded-xl border border-slate-700" />\n      <div>\n        <a href="${repo.html_url}" target="_blank" className="font-bold text-base text-white hover:underline">${repo.full_name}</a>\n        <div className="text-xs text-slate-400">${repo.language ? repo.language : 'Repository'} • ${repo.license ? repo.license : 'Open Source'}</div>\n      </div>\n    </div>\n    <a href="${repo.html_url}" target="_blank" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">View Repo</a>\n  </div>\n  <p className="text-xs text-slate-300 mt-3 leading-relaxed">${repo.description || ''}</p>\n  <div className="flex items-center gap-4 mt-4 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800/80">\n    <span>⭐ ${repo.stargazers_count.toLocaleString()} stars</span>\n    <span>🍴 ${repo.forks_count.toLocaleString()} forks</span>\n  </div>\n</div>`;
  };

  const getMarkdownCode = () => {
    return `[![${repo.full_name} GitHub Showcase](https://img.shields.io/github/stars/${repo.full_name}?style=for-the-badge&logo=github&color=6366f1)](https://github.com/${repo.full_name})\n[![License](https://img.shields.io/github/license/${repo.full_name}?style=for-the-badge&color=10b981)](https://github.com/${repo.full_name})`;
  };

  const getCurrentSnippet = () => {
    switch (embedType) {
      case 'iframe': return getIframeCode();
      case 'react': return getReactCode();
      case 'tailwind': return getTailwindCode();
      case 'markdown': return getMarkdownCode();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Embed & Export Code Snippet
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
        <button
          onClick={() => setEmbedType('tailwind')}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
            embedType === 'tailwind'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          HTML / Tailwind Card
        </button>

        <button
          onClick={() => setEmbedType('react')}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
            embedType === 'react'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          React Component (JSX)
        </button>

        <button
          onClick={() => setEmbedType('iframe')}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
            embedType === 'iframe'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          HTML iFrame
        </button>

        <button
          onClick={() => setEmbedType('markdown')}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
            embedType === 'markdown'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          Markdown Badges
        </button>
      </div>

      {/* Code Display Area */}
      <div className="relative">
        <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {getCurrentSnippet()}
        </pre>
      </div>
    </div>
  );
};
