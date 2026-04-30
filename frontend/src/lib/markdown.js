import React from "react";

export function normalizeMarkdownSource(source) {
  return String(source || "")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const text = String(label || "").replace(/<[^>]+>/g, "").trim() || href;
      return `[${text}](${href})`;
    });
}

function parseInline(text, keyPrefix) {
  const content = String(text || "");
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s)]+|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let index = 0;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
        >
          {match[2]}
        </a>
      );
    } else if (match[0].startsWith("http://") || match[0].startsWith("https://")) {
      nodes.push(
        <a
          key={`${keyPrefix}-url-${index}`}
          href={match[0]}
          target="_blank"
          rel="noreferrer"
        >
          {match[0]}
        </a>
      );
    } else if (match[4]) {
      nodes.push(<code key={`${keyPrefix}-code-${index}`}>{match[4]}</code>);
    } else if (match[5]) {
      nodes.push(<strong key={`${keyPrefix}-strong-${index}`}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={`${keyPrefix}-em-${index}`}>{match[6]}</em>);
    }

    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [content];
}

function isOrderedListItem(line) {
  return /^\d+\.\s+/.test(line);
}

function isUnorderedListItem(line) {
  return /^[-*]\s+/.test(line);
}

export function MarkdownContent({ source }) {
  const lines = normalizeMarkdownSource(source).split("\n");
  const blocks = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        <pre key={`block-${key}`} className="markdown-pre">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      key += 1;
      continue;
    }

    if (trimmed.startsWith("<details")) {
      const detailLines = [];

      while (index < lines.length) {
        detailLines.push(lines[index]);

        if (lines[index].trim().includes("</details>")) {
          index += 1;
          break;
        }

        index += 1;
      }

      const detailSource = detailLines.join("\n");
      const summaryMatch = detailSource.match(/<summary>([\s\S]*?)<\/summary>/i);
      const summaryText = summaryMatch ? summaryMatch[1].trim() : "상세 보기";
      const body = detailSource
        .replace(/<details[^>]*>/i, "")
        .replace(/<\/details>/i, "")
        .replace(/<summary>[\s\S]*?<\/summary>/i, "")
        .trim();

      blocks.push(
        <details key={`block-${key}`} className="markdown-details">
          <summary className="markdown-summary">{parseInline(summaryText, `summary-${key}`)}</summary>
          {body ? (
            <div className="markdown-details-body">
              <MarkdownContent source={body} />
            </div>
          ) : null}
        </details>
      );
      key += 1;
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      blocks.push(<hr key={`block-${key}`} className="markdown-hr" />);
      index += 1;
      key += 1;
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0].length;
      const HeadingTag = `h${Math.min(level, 6)}`;
      const text = trimmed.replace(/^#{1,6}\s+/, "");

      blocks.push(
        <HeadingTag key={`block-${key}`} className={`markdown-h${Math.min(level, 6)}`}>
          {parseInline(text, `heading-${key}`)}
        </HeadingTag>
      );
      index += 1;
      key += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines = [];

      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push(
        <blockquote key={`block-${key}`} className="markdown-blockquote">
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`quote-${key}-${quoteIndex}`}>{parseInline(quoteLine, `quote-${key}-${quoteIndex}`)}</p>
          ))}
        </blockquote>
      );
      key += 1;
      continue;
    }

    if (isUnorderedListItem(trimmed) || isOrderedListItem(trimmed)) {
      const isOrdered = isOrderedListItem(trimmed);
      const ListTag = isOrdered ? "ol" : "ul";
      const items = [];

      while (index < lines.length) {
        const currentLine = lines[index].trim();

        if (!currentLine || (isOrdered ? !isOrderedListItem(currentLine) : !isUnorderedListItem(currentLine))) {
          break;
        }

        items.push(currentLine.replace(isOrdered ? /^\d+\.\s+/ : /^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ListTag key={`block-${key}`} className="markdown-list">
          {items.map((item, itemIndex) => (
            <li key={`item-${key}-${itemIndex}`}>{parseInline(item, `item-${key}-${itemIndex}`)}</li>
          ))}
        </ListTag>
      );
      key += 1;
      continue;
    }

    const paragraphLines = [];

    while (index < lines.length) {
      const currentLine = lines[index];
      const currentTrimmed = currentLine.trim();

      if (
        !currentTrimmed ||
        currentTrimmed.startsWith("```") ||
        /^#{1,6}\s+/.test(currentTrimmed) ||
        currentTrimmed.startsWith(">") ||
        isUnorderedListItem(currentTrimmed) ||
        isOrderedListItem(currentTrimmed)
      ) {
        break;
      }

      paragraphLines.push(currentTrimmed);
      index += 1;
    }

    blocks.push(
      <p key={`block-${key}`} className="markdown-paragraph">
        {paragraphLines.flatMap((paragraphLine, paragraphIndex) => {
          const nodes = parseInline(paragraphLine, `paragraph-${key}-${paragraphIndex}`);

          if (paragraphIndex === 0) {
            return nodes;
          }

          return [<br key={`paragraph-${key}-break-${paragraphIndex}`} />, ...nodes];
        })}
      </p>
    );
    key += 1;
  }

  return <div className="markdown-content">{blocks}</div>;
}
