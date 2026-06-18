const docs = [
  {
    id: "backend/features.md",
    title: "Backend Features",
    group: "Backend",
    summary: "Business flows, lifecycle rules, RBAC, and final release scope for the commerce build."
  },
  {
    id: "backend/api-documentation.md",
    title: "API Documentation",
    group: "Backend",
    summary: "Endpoint-by-endpoint API contract with payloads, responses, validation rules, and FE/BE conventions."
  },
  {
    id: "backend/db-design.md",
    title: "DB Design",
    group: "Backend",
    summary: "MongoDB collections, embedded documents, indexes, constraints, and transaction rules."
  },
  {
    id: "frontend/frontend-pages.md",
    title: "Frontend Pages",
    group: "Frontend",
    summary: "Page inventory and route map for participant-facing customer and admin interfaces."
  },
  {
    id: "frontend/frontend-state-contract.md",
    title: "Frontend State Contract",
    group: "Frontend",
    summary: "Loading, error, form, RBAC, and integration rules frontend teams should follow."
  },
  {
    id: "frontend/frontend-types.ts",
    title: "Frontend Types",
    group: "Frontend",
    summary: "Shared TypeScript type layer aligned to the documented API contracts."
  },
  {
    id: "frontend/frontend-api-mocks.json",
    title: "Frontend API Mocks",
    group: "Frontend",
    summary: "Ready-to-use mock payloads for building UI without waiting on a live backend."
  }
];

const backendNav = document.querySelector("#backend-nav");
const frontendNav = document.querySelector("#frontend-nav");
const searchInput = document.querySelector("#doc-search");
const docGroup = document.querySelector("#doc-group");
const docTitle = document.querySelector("#doc-title");
const docSummary = document.querySelector("#doc-summary");
const docContent = document.querySelector("#doc-content");
const rawLink = document.querySelector("#raw-link");
const copyLinkButton = document.querySelector("#copy-link");
const statusBanner = document.querySelector("#status-banner");
const sidebar = document.querySelector("#sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");

marked.setOptions({
  breaks: true,
  gfm: true
});

function getSelectedDocId() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return hash.get("doc") || docs[0].id;
}

function setSelectedDocId(id) {
  const hash = new URLSearchParams();
  hash.set("doc", id);
  window.location.hash = hash.toString();
}

function setSidebarOpen(isOpen) {
  document.body.classList.toggle("sidebar-open", isOpen);
  sidebarToggle?.setAttribute("aria-expanded", String(isOpen));
}

function renderNav(filterText = "") {
  const query = filterText.trim().toLowerCase();

  const renderItems = (groupName, container) => {
    container.innerHTML = "";
    docs
      .filter((doc) => doc.group === groupName)
      .filter((doc) => {
        if (!query) return true;
        return (
          doc.title.toLowerCase().includes(query) ||
          doc.summary.toLowerCase().includes(query) ||
          doc.id.toLowerCase().includes(query)
        );
      })
      .forEach((doc) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "doc-link";
        button.dataset.docId = doc.id;
        button.innerHTML = `<strong>${doc.title}</strong><small>${doc.summary}</small>`;
        button.addEventListener("click", () => {
          setSelectedDocId(doc.id);
          setSidebarOpen(false);
        });
        container.appendChild(button);
      });
  };

  renderItems("Backend", backendNav);
  renderItems("Frontend", frontendNav);
  updateActiveNav();
}

function updateActiveNav() {
  const selected = getSelectedDocId();

  document.querySelectorAll(".doc-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.docId === selected);
  });
}

function showStatus(message) {
  statusBanner.hidden = false;
  statusBanner.textContent = message;
}

function clearStatus() {
  statusBanner.hidden = true;
  statusBanner.textContent = "";
}

function renderContent(rawText, doc) {
  const extension = doc.id.split(".").pop();
  if (extension === "md") {
    docContent.innerHTML = marked.parse(rawText);
    return;
  }

  if (extension === "json" || extension === "ts") {
    renderCodeBlock(rawText, extension);
    return;
  }

  docContent.textContent = rawText;
}

function renderCodeBlock(rawText, extension) {
  const panel = document.createElement("section");
  panel.className = "code-panel";

  const header = document.createElement("div");
  header.className = "code-panel-header";

  const label = document.createElement("p");
  label.className = "code-panel-label";
  label.textContent = extension === "json" ? "JSON Reference" : "TypeScript Reference";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-copy-button";
  button.textContent = "Copy code";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Copy code";
      }, 1400);
    } catch {
      showStatus("Could not copy the code automatically. Select and copy it manually.");
    }
  });

  header.append(label, button);

  const pre = document.createElement("pre");
  pre.className = `code-view code-view-${extension}`;

  const code = document.createElement("code");
  code.innerHTML = extension === "json" ? highlightJson(rawText) : highlightTypeScript(rawText);

  pre.appendChild(code);
  panel.append(header, pre);

  docContent.innerHTML = "";
  docContent.appendChild(panel);
}

function highlightJson(text) {
  const tokenRegex =
    /("(?:\\.|[^"\\])*")(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;
  let cursor = 0;
  let html = "";

  for (const match of text.matchAll(tokenRegex)) {
    const index = match.index ?? 0;
    const token = match[0];
    const stringToken = match[1];
    const colonToken = match[2];

    html += escapeHtml(text.slice(cursor, index));

    if (stringToken && colonToken) {
      html += `<span class="token-key">${escapeHtml(stringToken)}</span><span class="token-punctuation">${escapeHtml(
        colonToken
      )}</span>`;
    } else if (stringToken) {
      html += `<span class="token-string">${escapeHtml(stringToken)}</span>`;
    } else {
      html += `<span class="${classifyJsonPrimitive(token)}">${escapeHtml(token)}</span>`;
    }

    cursor = index + token.length;
  }

  html += escapeHtml(text.slice(cursor));
  return html;
}

function classifyJsonPrimitive(token) {
  if (token === "true" || token === "false") {
    return "token-boolean";
  }

  if (token === "null") {
    return "token-null";
  }

  if (/^-?\d/.test(token)) {
    return "token-number";
  }

  return "token-punctuation";
}

function highlightTypeScript(text) {
  const tokenRegex =
    /\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:export|type|const|let|var|return|if|else|true|false|null|undefined)\b|\b(?:string|number|boolean|unknown|never|void)\b|-?\d+(?:\.\d+)?|[{}[\](),.:;|<>?=]/gm;
  return highlightWithTokenizer(text, tokenRegex, classifyTypeScriptToken);
}

function classifyTypeScriptToken(token) {
  if (token.startsWith("//")) {
    return "token-comment";
  }

  if (/^["'`]/.test(token)) {
    return "token-string";
  }

  if (/^-?\d/.test(token)) {
    return "token-number";
  }

  if (/^(true|false|null|undefined)$/.test(token)) {
    return "token-boolean";
  }

  if (/^(export|type|const|let|var|return|if|else)$/.test(token)) {
    return "token-keyword";
  }

  if (/^(string|number|boolean|unknown|never|void)$/.test(token)) {
    return "token-type";
  }

  return "token-punctuation";
}

function highlightWithTokenizer(text, tokenRegex, classifyToken) {
  let cursor = 0;
  let html = "";

  for (const match of text.matchAll(tokenRegex)) {
    const index = match.index ?? 0;
    const token = match[0];

    html += escapeHtml(text.slice(cursor, index));
    html += `<span class="${classifyToken(token)}">${escapeHtml(token)}</span>`;
    cursor = index + token.length;
  }

  html += escapeHtml(text.slice(cursor));
  return html;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function loadDoc() {
  const selected = getSelectedDocId();
  const doc = docs.find((item) => item.id === selected) || docs[0];

  docGroup.textContent = doc.group;
  docTitle.textContent = doc.title;
  docSummary.textContent = doc.summary;
  rawLink.href = `./${doc.id}`;
  updateActiveNav();
  clearStatus();

  docContent.innerHTML = `
    <div class="loading-state">
      <div class="loading-line"></div>
      <div class="loading-line short"></div>
      <div class="loading-line"></div>
    </div>
  `;

  if (window.location.protocol === "file:") {
    showStatus("This docs viewer must be opened through a local HTTP server, not directly via file://.");
    docContent.innerHTML = `
      <h3>Local server required</h3>
      <p>Browser security blocks loading <code>.md</code>, <code>.json</code>, and <code>.ts</code> files with <code>fetch()</code> when this page is opened directly from disk.</p>
      <p>Run this from the repository root:</p>
      <pre><code>python3 -m http.server 8765</code></pre>
      <p>Then open:</p>
      <pre><code>http://127.0.0.1:8765/</code></pre>
    `;
    return;
  }

  try {
    const response = await fetch(`./${doc.id}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${doc.id} (${response.status})`);
    }
    const text = await response.text();
    renderContent(text, doc);
  } catch (error) {
    showStatus(error.message);
    docContent.innerHTML = `
      <h3>Document unavailable</h3>
      <p>The selected file could not be loaded from this static deployment.</p>
      <pre><code>${escapeHtml(String(error))}</code></pre>
    `;
  }
}

searchInput.addEventListener("input", (event) => {
  renderNav(event.target.value);
});

copyLinkButton.addEventListener("click", async () => {
  const url = `${window.location.origin}${window.location.pathname}#doc=${encodeURIComponent(
    getSelectedDocId()
  )}`;
  try {
    await navigator.clipboard.writeText(url);
    copyLinkButton.textContent = "Link copied";
    setTimeout(() => {
      copyLinkButton.textContent = "Copy deep link";
    }, 1400);
  } catch {
    showStatus("Could not copy the link automatically. Copy the URL from the browser address bar.");
  }
});

window.addEventListener("hashchange", loadDoc);

sidebarToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.contains("sidebar-open");
  setSidebarOpen(!isOpen);
});

sidebarBackdrop?.addEventListener("click", () => {
  setSidebarOpen(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1080) {
    setSidebarOpen(false);
  }
});

renderNav();
loadDoc();
