/**
 * 创建一个DOM打字机效果
 * @param element 目标元素
 * @param htmlString 要显示的 HTML 字符串
 * @param typingSpeed 打字速度，单位为毫秒
 */
export default function createTypewriter(element: HTMLElement, htmlString: string, typingSpeed = 100) {
  // 核心就是使用 DOMParser 解析字符串然后进行遍历
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const fragment = doc.body;
  const nodes: { type: string; content: string; element: HTMLElement | null }[] = [];

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue?.trim()) {
        nodes.push({ type: "text", content: node.nodeValue, element: null });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elementNode = node as HTMLElement;

      const isBody = elementNode.tagName.toLowerCase() === "body";
      const tagName = isBody ? "section" : elementNode.tagName.toLowerCase();
      const clone = document.createElement(tagName);

      for (const attr of elementNode.attributes) {
        clone.setAttribute(attr.name, attr.value);
      }
      nodes.push({ type: "tag-start", content: "", element: clone });
      for (const child of elementNode.childNodes) {
        traverse(child);
      }
      nodes.push({
        type: "tag-end",
        element: clone,
        content: ""
      });
    }
  }

  traverse(fragment);

  let cursor = 0;
  const stack: (HTMLElement | null)[] = [];

  function typeNext() {
    if (cursor >= nodes.length) return;

    const currentNode = nodes[cursor];
    if (currentNode.type === "tag-start") {
      const elementNode = currentNode.element;
      if (elementNode) {
        (stack[stack.length - 1] || element).appendChild(elementNode);
        stack.push(elementNode);
      }
      cursor++;
      typeNext();
    } else if (currentNode.type === "tag-end") {
      stack.pop();
      cursor++;
      typeNext();
    } else if (currentNode.type === "text") {
      const text = currentNode.content;
      let textCursor = 0;
      const parent = stack[stack.length - 1] || element;

      function typeText() {
        if (textCursor < text.length) {
          parent.appendChild(document.createTextNode(text[textCursor]));
          textCursor++;
          setTimeout(typeText, typingSpeed);
        } else {
          cursor++;
          typeNext();
        }
      }
      typeText();
    }
  }

  typeNext();
}
