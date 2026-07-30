// components/SimpleMarkdown.tsx
import { Text, View } from "react-native";

type SimpleMarkdownProps = {
  content: string;
  textColor?: string;
  codeBackgroundColor?: string;
};

// Parses inline formatting: **bold**, *italic*, `code`
function parseInline(
  text: string,
  textColor: string,
  codeBackgroundColor: string,
) {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Order matters: check bold (**) before italic (*) to avoid partial matches
  const pattern = /(\*\*.+?\*\*|\*.+?\*|`.+?`)/;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);

    if (!match || match.index === undefined) {
      nodes.push(
        <Text key={key++} style={{ color: textColor }}>
          {remaining}
        </Text>,
      );
      break;
    }

    if (match.index > 0) {
      nodes.push(
        <Text key={key++} style={{ color: textColor }}>
          {remaining.slice(0, match.index)}
        </Text>,
      );
    }

    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(
        <Text key={key++} style={{ color: textColor, fontWeight: "700" }}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <Text
          key={key++}
          style={{
            color: textColor,
            backgroundColor: codeBackgroundColor,
            fontFamily: "monospace",
            fontSize: 13.5,
          }}
        >
          {" "}
          {token.slice(1, -1)}{" "}
        </Text>,
      );
    } else {
      nodes.push(
        <Text key={key++} style={{ color: textColor, fontStyle: "italic" }}>
          {token.slice(1, -1)}
        </Text>,
      );
    }

    remaining = remaining.slice(match.index + token.length);
  }

  return nodes;
}

export default function SimpleMarkdown({
  content,
  textColor = "#1a1a1a",
  codeBackgroundColor = "#f0f0f0",
}: SimpleMarkdownProps) {
  const lines = content.split("\n");

  const blocks: React.ReactNode[] = [];
  let listBuffer: { text: string; ordered: boolean }[] = [];
  let codeBuffer: string[] | null = null;
  let key = 0;

  function flushList() {
    if (listBuffer.length === 0) return;
    blocks.push(
      <View key={key++} style={{ marginVertical: 4 }}>
        {listBuffer.map((item, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 4 }}
          >
            <Text style={{ color: textColor, marginRight: 6 }}>
              {item.ordered ? `${i + 1}.` : "•"}
            </Text>
            <Text style={{ flex: 1 }}>
              {parseInline(item.text, textColor, codeBackgroundColor)}
            </Text>
          </View>
        ))}
      </View>,
    );
    listBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine;

    // Code fence toggle
    if (line.trim().startsWith("```")) {
      if (codeBuffer === null) {
        flushList();
        codeBuffer = [];
      } else {
        blocks.push(
          <View
            key={key++}
            style={{
              backgroundColor: "#1e1e1e",
              borderRadius: 8,
              padding: 12,
              marginVertical: 6,
            }}
          >
            <Text
              style={{
                color: "#f8f8f2",
                fontFamily: "monospace",
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              {codeBuffer.join("\n")}
            </Text>
          </View>,
        );
        codeBuffer = null;
      }
      continue;
    }

    if (codeBuffer !== null) {
      codeBuffer.push(line);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].length;
      const fontSize = level === 1 ? 22 : level === 2 ? 19 : 17;
      blocks.push(
        <Text
          key={key++}
          style={{
            color: textColor,
            fontSize,
            fontWeight: "700",
            marginTop: 10,
            marginBottom: 6,
          }}
        >
          {parseInline(headerMatch[2], textColor, codeBackgroundColor)}
        </Text>,
      );
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (bulletMatch) {
      listBuffer.push({ text: bulletMatch[1], ordered: false });
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (numberedMatch) {
      listBuffer.push({ text: numberedMatch[1], ordered: true });
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      flushList();
      blocks.push(<View key={key++} style={{ height: 6 }} />);
      continue;
    }

    // Regular paragraph
    flushList();
    blocks.push(
      <Text
        key={key++}
        style={{ color: textColor, fontSize: 15, lineHeight: 22 }}
      >
        {parseInline(line, textColor, codeBackgroundColor)}
      </Text>,
    );
  }

  flushList();

  // Unclosed code fence while streaming — render what we have so far
  if (codeBuffer !== null) {
    blocks.push(
      <View
        key={key++}
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 8,
          padding: 12,
          marginVertical: 6,
        }}
      >
        <Text
          style={{
            color: "#f8f8f2",
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {codeBuffer.join("\n")}
        </Text>
      </View>,
    );
  }

  return <View>{blocks}</View>;
}
