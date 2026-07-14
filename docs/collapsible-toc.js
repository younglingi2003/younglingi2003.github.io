(function () {
  function initCollapsibleTOC() {
    var content = document.getElementById("content") || document.getElementById("postBody");
    if (!content) return;

    document.querySelectorAll(".toc").forEach(function (element) {
      element.remove();
    });

    var headings = Array.from(content.querySelectorAll("h1, h2, h3, h4")).filter(function (heading) {
      return heading.textContent.trim();
    });
    if (!headings.length) return;

    var usedIds = new Map();
    function makeId(text) {
      var base = text.trim().toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u4e00-\u9fff\-+.：？！()（）]/g, "") || "section";
      var count = usedIds.get(base) || 0;
      usedIds.set(base, count + 1);
      return count ? base + "-" + (count + 1) : base;
    }

    headings.forEach(function (heading) {
      heading.id = makeId(heading.textContent);
    });

    var roots = [];
    var stack = [];
    headings.forEach(function (heading) {
      var node = {
        heading: heading,
        level: Number(heading.tagName.slice(1)),
        children: []
      };
      while (stack.length && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }
      if (stack.length) {
        stack[stack.length - 1].children.push(node);
      } else {
        roots.push(node);
      }
      stack.push(node);
    });

    var toc = document.createElement("nav");
    toc.className = "toc collapsible-toc";
    toc.setAttribute("aria-label", "文章目录");

    var title = document.createElement("div");
    title.className = "toc-title";
    title.textContent = "文章目录";
    toc.appendChild(title);

    function renderList(nodes) {
      var list = document.createElement("ul");
      list.className = "toc-list";

      nodes.forEach(function (node) {
        var item = document.createElement("li");
        item.className = "toc-item";

        var row = document.createElement("div");
        row.className = "toc-row";

        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "toc-toggle";
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = node.children.length ? "▸" : "";
        if (!node.children.length) {
          toggle.disabled = true;
          toggle.setAttribute("aria-hidden", "true");
        }

        var link = document.createElement("a");
        link.className = "toc-link";
        link.href = "#" + node.heading.id;
        link.textContent = node.heading.textContent.trim();

        row.appendChild(toggle);
        row.appendChild(link);
        item.appendChild(row);

        if (node.children.length) {
          var children = renderList(node.children);
          children.classList.add("toc-children");
          children.hidden = true;
          item.appendChild(children);

          function setExpanded(expanded) {
            children.hidden = !expanded;
            toggle.setAttribute("aria-expanded", String(expanded));
            toggle.setAttribute("aria-label", expanded ? "收起子目录" : "展开子目录");
            toggle.textContent = expanded ? "▾" : "▸";
          }

          toggle.setAttribute("aria-label", "展开子目录");
          toggle.addEventListener("click", function () {
            setExpanded(toggle.getAttribute("aria-expanded") !== "true");
          });
          link.addEventListener("click", function () {
            setExpanded(toggle.getAttribute("aria-expanded") !== "true");
          });
        }

        list.appendChild(item);
      });

      return list;
    }

    toc.appendChild(renderList(roots));
    content.prepend(toc);

    var style = document.createElement("style");
    style.textContent = [
      ".collapsible-toc { position: fixed; top: 110px; left: calc(50% + 350px); width: 280px; max-height: 72vh; overflow-y: auto; border: 1px solid var(--borderColor-default, #30363d); border-radius: 8px; padding: 12px; background: var(--bgColor-default, #0d1117); box-shadow: 0 4px 16px rgba(0,0,0,.2); z-index: 20; }",
      ".collapsible-toc .toc-title { font-size: 1.15rem; font-weight: 700; text-align: center; padding-bottom: 10px; margin-bottom: 6px; border-bottom: 1px solid var(--borderColor-default, #30363d); }",
      ".collapsible-toc .toc-list { list-style: none; margin: 0; padding: 0; }",
      ".collapsible-toc .toc-children { padding-left: 16px; }",
      ".collapsible-toc .toc-children[hidden] { display: none !important; }",
      ".collapsible-toc .toc-row { display: flex; align-items: flex-start; gap: 4px; padding: 4px 0; }",
      ".collapsible-toc .toc-toggle { width: 22px; min-width: 22px; padding: 1px 0; border: 0; background: transparent; color: var(--fgColor-muted, #8b949e); cursor: pointer; font-size: 14px; line-height: 1.5; }",
      ".collapsible-toc .toc-toggle:disabled { cursor: default; }",
      ".collapsible-toc .toc-link { color: var(--fgColor-default, #e6edf3); text-decoration: none; font-size: 14px; line-height: 1.5; flex: 1; overflow-wrap: anywhere; }",
      ".collapsible-toc .toc-link:hover { color: var(--fgColor-accent, #2f81f7); text-decoration: underline; }",
      "@media (max-width: 1249px) { .collapsible-toc { position: static; width: auto; max-height: none; margin-bottom: 20px; } }"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCollapsibleTOC);
  } else {
    initCollapsibleTOC();
  }
})();
