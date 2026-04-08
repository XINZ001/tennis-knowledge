import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import KpLink from './KpLink'
import ExpertQuote from './ExpertQuote'
import TipBlock from './TipBlock'
import WarningBlock from './WarningBlock'
import VideoEmbed from './VideoEmbed'
import IllustrationEmbed from './IllustrationEmbed'

/**
 * ArticleRenderer — Markdown + custom syntax rendering engine
 *
 * Custom syntax:
 *   {{kp-id||text}}           → <KpLink>
 *   :::expert\n...\n:::       → <ExpertQuote>
 *   :::tip\n...\n:::          → <TipBlock>
 *   :::warning\n...\n:::      → <WarningBlock>
 *   :::video\nyoutube:ID\n::: → <VideoEmbed>
 *   :::video\nbilibili:ID\n:::→ <VideoEmbed>
 *   :::illustration\nkpId\ncaption\n::: → <IllustrationEmbed>
 *   <!-- TODO:... -->          → hidden
 */

// Parse custom ::: blocks and KP links from markdown content
function parseContent(markdown) {
  if (!markdown) return []

  // Remove HTML comments (<!-- TODO:... --> etc.)
  let cleaned = markdown.replace(/<!--[\s\S]*?-->/g, '')

  // Split on ::: blocks
  const parts = []
  const blockRegex = /:::(expert|tip|warning|video|illustration)\n([\s\S]*?):::/g
  let lastIndex = 0
  let match

  while ((match = blockRegex.exec(cleaned)) !== null) {
    // Text before this block
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: cleaned.slice(lastIndex, match.index) })
    }
    parts.push({ type: match[1], content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  // Remaining text after last block
  if (lastIndex < cleaned.length) {
    parts.push({ type: 'markdown', content: cleaned.slice(lastIndex) })
  }

  return parts
}

// Shared markdown component overrides
const baseComponents = {
  h2: ({ children }) => <h2 className="text-2xl font-bold mt-10 mb-4">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-semibold mt-8 mb-3">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-semibold mt-6 mb-2">{children}</h4>,
  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-8 border-t border-stone-border/40" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6 rounded-lg border border-stone-border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#EDE9E3]">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-stone-border last:border-b-0">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2.5 text-left font-semibold text-text-primary whitespace-nowrap border-r border-stone-border last:border-r-0">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2.5 text-text-secondary border-r border-stone-border/60 last:border-r-0">{children}</td>,
}

// Custom component to render inline KP links within markdown text
function MarkdownWithKpLinks({ content }) {
  // Split content on {{kp-id||text}} pattern
  const kpRegex = /\{\{(kp-[a-z0-9-]+)\|\|([^}]+)\}\}/g
  const segments = []
  let lastIdx = 0
  let m

  while ((m = kpRegex.exec(content)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ type: 'md', text: content.slice(lastIdx, m.index) })
    }
    segments.push({ type: 'kp', kpId: m[1], label: m[2] })
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < content.length) {
    segments.push({ type: 'md', text: content.slice(lastIdx) })
  }

  // If no KP links, render plain markdown
  if (segments.length === 1 && segments[0].type === 'md') {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...baseComponents,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-forest underline hover:text-forest/80">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  // Mixed content: replace kp links with /kp-link/ paths for ReactMarkdown
  const processedMd = content.replace(kpRegex, (_, kpId, label) => `[${label}](/kp-link/${kpId})`)

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ...baseComponents,
        a: ({ href, children }) => {
          // Intercept /kp-link/ paths
          if (href?.startsWith('/kp-link/')) {
            const kpId = href.replace('/kp-link/', '')
            return <KpLink kpId={kpId}>{children}</KpLink>
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-forest underline hover:text-forest/80">
              {children}
            </a>
          )
        },
      }}
    >
      {processedMd}
    </ReactMarkdown>
  )
}

export default function ArticleRenderer({ content }) {
  const parts = useMemo(() => parseContent(content), [content])

  return (
    <div className="article-content text-text-primary text-[15px]">
      {parts.map((part, i) => {
        switch (part.type) {
          case 'markdown':
            return <MarkdownWithKpLinks key={i} content={part.content} />

          case 'expert':
            return (
              <ExpertQuote key={i}>
                <MarkdownWithKpLinks content={part.content} />
              </ExpertQuote>
            )

          case 'tip':
            return (
              <TipBlock key={i}>
                <MarkdownWithKpLinks content={part.content} />
              </TipBlock>
            )

          case 'warning':
            return (
              <WarningBlock key={i}>
                <MarkdownWithKpLinks content={part.content} />
              </WarningBlock>
            )

          case 'video': {
            const videoMatch = part.content.match(/^(youtube|bilibili):(.+)$/)
            if (videoMatch) {
              return <VideoEmbed key={i} platform={videoMatch[1]} videoId={videoMatch[2]} />
            }
            return null
          }

          case 'illustration': {
            const lines = part.content.split('\n')
            const kpId = lines[0]?.trim()
            const caption = lines[1]?.trim() || ''
            return <IllustrationEmbed key={i} kpId={kpId} caption={caption} />
          }

          default:
            return null
        }
      })}
    </div>
  )
}
