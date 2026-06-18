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
const heroBackendLink = document.querySelector("#hero-backend-link");
const heroFrontendLink = document.querySelector("#hero-frontend-link");

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
        button.addEventListener("click", () => setSelectedDocId(doc.id));
        container.appendChild(button);
      });
  };

  renderItems("Backend", backendNav);
  renderItems("Frontend", frontendNav);
  updateActiveNav();
}

function updateActiveNav() {
  const selected = getSelectedDocId();
  const activeDoc = docs.find((item) => item.id === selected) || docs[0];

  document.querySelectorAll(".doc-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.docId === selected);
  });

  heroBackendLink.classList.toggle("is-active", activeDoc.group === "Backend");
  heroFrontendLink.classList.toggle("is-active", activeDoc.group === "Frontend");
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
    docContent.innerHTML = `<pre><code>${escapeHtml(rawText)}</code></pre>`;
    return;
  }

  docContent.textContent = rawText;
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

renderNav();
loadDoc();
