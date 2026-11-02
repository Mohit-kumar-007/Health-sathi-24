import type { ReactNode } from 'react'

// Renders the small subset of Markdown used in lesson notes: paragraphs, "- " bullets, "1." lists,
// "## " headings, **bold**, *italic* and [links](https://...). It builds React elements directly and
// never inserts raw HTML, so notes pasted from anywhere cannot inject scripts.

const SAFE_URL = /^(https?:\/\/|mailto:)/i
const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g

function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE)
  return (
    <>
      {parts.map((part, index) => {
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-navy">{part.slice(2, -2)}</strong>
        }
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
          return <em key={index}>{part.slice(1, -1)}</em>
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
        if (link && SAFE_URL.test(link[2])) {
          return (
            <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-text underline">
              {link[1]}
            </a>
          )
        }
        return part
      })}
    </>
  )
}

function Block({ block }: { block: string }): ReactNode {
  const lines = block.split('\n')

  if (lines.every((line) => line.startsWith('- '))) {
    return (
      <ul className="list-disc space-y-2 pl-6 marker:text-leaf">
        {lines.map((line, index) => (
          <li key={index}>
            <Inline text={line.slice(2)} />
          </li>
        ))}
      </ul>
    )
  }
  if (lines.every((line) => /^\d+\. /.test(line))) {
    return (
      <ol className="list-decimal space-y-2 pl-6 marker:font-bold marker:text-leaf">
        {lines.map((line, index) => (
          <li key={index}>
            <Inline text={line.replace(/^\d+\. /, '')} />
          </li>
        ))}
      </ol>
    )
  }
  const heading = lines.length === 1 ? block.match(/^(#{2,3}) (.+)$/) : null
  if (heading) {
    return <h3 className="pt-2 text-lg font-extrabold text-navy">{heading[2]}</h3>
  }
  return (
    <p className="whitespace-pre-line leading-relaxed">
      <Inline text={block} />
    </p>
  )
}

export function Markdown({ source }: { source: string }) {
  const blocks = source
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}
