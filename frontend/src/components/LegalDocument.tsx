import { useEffect, type ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

// A legal document copied word for word from a Word file (see content/*.ts). Headings, clauses and bullets
// are shown in the order and wording of the document. `indent` only moves a clause to the right so that
// (a) / (i) numbering is easy to follow; it never changes the text.
export type LegalBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; indent: number; text: string }
  | { type: 'bullet'; indent: number; text: string }

const INDENT: Record<number, string> = {
  0: '',
  1: 'ml-4 sm:ml-8',
  2: 'ml-8 sm:ml-16',
  3: 'ml-12 sm:ml-24',
}

const HEADING_STYLE = {
  1: 'text-3xl font-extrabold tracking-tight text-navy sm:text-4xl',
  2: 'mt-10 text-xl font-extrabold text-navy sm:text-2xl',
  3: 'mt-6 text-lg font-extrabold text-navy',
} as const

function indentOf(indent: number): string {
  return INDENT[indent] ?? INDENT[3]
}

export function LegalDocument({ blocks }: { blocks: LegalBlock[] }) {
  const content: ReactNode[] = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]

    if (block.type === 'heading') {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'
      content.push(
        <Tag key={index} className={HEADING_STYLE[block.level]}>
          {block.text}
        </Tag>,
      )
    } else if (block.type === 'bullet') {
      // Bullets that follow each other form one list.
      const items: { text: string; key: number }[] = [{ text: block.text, key: index }]
      while (blocks[index + 1]?.type === 'bullet') {
        index += 1
        items.push({ text: blocks[index].text, key: index })
      }
      content.push(
        <ul key={items[0].key} className={`mt-4 list-disc space-y-3 pl-5 marker:text-leaf ${indentOf(block.indent)}`}>
          {items.map((item) => (
            <li key={item.key} className="whitespace-pre-wrap break-words">
              {item.text}
            </li>
          ))}
        </ul>,
      )
    } else {
      content.push(
        <p key={index} className={`mt-4 whitespace-pre-wrap break-words ${indentOf(block.indent)}`}>
          {block.text}
        </p>,
      )
    }
  }

  return <div className="leading-relaxed text-ink-soft">{content}</div>
}

// The same header, footer, width and fonts as the other pages. Nothing is added around the document.
export function LegalDocumentPage({ pageTitle, blocks }: { pageTitle: string; blocks: LegalBlock[] }) {
  useEffect(() => {
    document.title = `${pageTitle} | HealthSathi24`
  }, [pageTitle])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <LegalDocument blocks={blocks} />
      </main>
      <Footer />
    </>
  )
}
