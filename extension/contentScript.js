console.log("[SF Extractor] content script loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EXTRACT") {
    console.log("[SF Extractor] EXTRACT received from popup");
    extractCurrentObject();
    sendResponse({ ok: true });
  }
});

/* ---------- Shadow indicator (NO IMPORTS) ---------- */
function showIndicator(text, color = "#16a34a") {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.bottom = "16px";
  host.style.right = "16px";
  host.style.zIndex = "999999";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      .box {
        background: ${color};
        color: white;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-family: ui-sans-serif, system-ui, -apple-system;
        box-shadow: 0 6px 20px rgba(0,0,0,.2);
      }
    </style>
    <div class="box">${text}</div>
  `;
  setTimeout(() => host.remove(), 2500);
}

/* ---------------- Helpers ---------------- */
const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function stripUiNoise(s) {
  let v = clean(s);
  // common Lightning UI additions
  v = v.replace(/\bOpen\b.*$/i, "").trim();
  v = v.replace(/\bPreview\b.*$/i, "").trim();
  v = v.replace(/\bChange Owner\b.*$/i, "").trim();
  v = v.replace(/\bMore Email Actions\b.*$/i, "").trim();
  // when it returns "Edit X"
  v = v.replace(/^Edit\s+/i, "").trim();
  return v;
}

function sanitizeEmail(v) {
  const t = stripUiNoise(v);
  return emailRegex.test(t) ? t : "";
}

function sanitizeOwner(v) {
  return stripUiNoise(v);
}

function sanitizeLeadSource(v) {
  const t = stripUiNoise(v);
  if (/lead source/i.test(t) && /edit/i.test(v)) return "";
  return t;
}

function sanitizePhone(v) {
  const t = stripUiNoise(v);
  // keep digits + common phone chars
  const p = t.replace(/[^\d()+\-.\s]/g, "").trim();
  return p;
}

/* ---------------- Object detection ---------------- */
function getObjectType() {
  const url = location.href;
  if (url.includes("/Lead/")) return "leads";
  if (url.includes("/Contact/")) return "contacts";
  if (url.includes("/Account/")) return "accounts";
  if (url.includes("/Opportunity/")) return "opportunities";
  if (url.includes("/Task/")) return "tasks";
  return null;
}

/* ---------------- Robust Lightning Field Reader ---------------- */
function getField(label) {
  // 1) Best case: records-record-layout-item blocks
  const layoutItems = [...document.querySelectorAll("records-record-layout-item")];
  for (const item of layoutItems) {
    const lab = item.querySelector(".slds-form-element__label");
    if (lab && clean(lab.innerText) === label) {
      const valueEl =
        item.querySelector('a[href^="mailto:"]') ||
        item.querySelector("lightning-formatted-email") ||
        item.querySelector("lightning-formatted-phone") ||
        item.querySelector("lightning-formatted-text") ||
        item.querySelector("lightning-formatted-url") ||
        item.querySelector("lightning-formatted-number") ||
        item.querySelector("lightning-formatted-date-time") ||
        item.querySelector(".slds-form-element__control") ||
        item.querySelector("dd");

      const val = valueEl ? clean(valueEl.innerText) : "";
      if (val && val !== label) return val;
    }
  }

  // 2) Generic SLDS pattern
  const labelCandidates = [
    ...document.querySelectorAll("dt, .slds-form-element__label, span[title], span[aria-label], span")
  ];

  const matches = labelCandidates.filter((el) => {
    const t = clean(el.textContent);
    const title = clean(el.getAttribute("title"));
    const aria = clean(el.getAttribute("aria-label"));
    return t === label || title === label || aria === label;
  });

  for (const el of matches) {
    // dt/dd
    if (el.tagName.toLowerCase() === "dt") {
      const dd = el.parentElement?.querySelector("dd");
      const v = clean(dd?.innerText);
      if (v && v !== label) return v;
    }

    const formEl = el.closest(".slds-form-element");
    if (formEl) {
      // try mailto/ formatted inside same block
      const mail = formEl.querySelector('a[href^="mailto:"]');
      if (mail && clean(mail.textContent)) return clean(mail.textContent);

      const fe = formEl.querySelector("lightning-formatted-email");
      if (fe && clean(fe.innerText)) return clean(fe.innerText);

      const fp = formEl.querySelector("lightning-formatted-phone");
      if (fp && clean(fp.innerText)) return clean(fp.innerText);

      const dd = formEl.querySelector("dd");
      const vdd = clean(dd?.innerText);
      if (vdd && vdd !== label) return vdd;

      const control = formEl.querySelector(".slds-form-element__control");
      const vctrl = clean(control?.innerText);
      if (vctrl && vctrl !== label) return vctrl;
    }

    // fallback next sibling
    const v1 = clean(el.closest("div")?.nextElementSibling?.innerText);
    if (v1 && v1 !== label) return v1;

    const v2 = clean(el.parentElement?.nextElementSibling?.innerText);
    if (v2 && v2 !== label) return v2;
  }

  return "";
}

/* ---------------- Primary header name ---------------- */
function getPrimaryName() {
  const el = document.querySelector('[slot="primaryField"]');
  return clean(el?.innerText);
}

/* ---------------- Special field helpers ---------------- */
function getEmailValue() {
  // scan all mailto links (sometimes there are multiple)
  const mailtos = [...document.querySelectorAll('a[href^="mailto:"]')];
  for (const a of mailtos) {
    const txt = clean(a.textContent);
    const ok1 = sanitizeEmail(txt);
    if (ok1) return ok1;

    const href = a.getAttribute("href") || "";
    const fromHref = href.replace(/^mailto:/i, "").split("?")[0];
    const ok2 = sanitizeEmail(fromHref);
    if (ok2) return ok2;
  }

  // lightning formatted
  const fes = [...document.querySelectorAll("lightning-formatted-email")];
  for (const fe of fes) {
    const ok = sanitizeEmail(fe.innerText);
    if (ok) return ok;
  }

  // label fallback (validated)
  return sanitizeEmail(getField("Email"));
}

function getPhoneValue() {
  const fp = document.querySelector("lightning-formatted-phone");
  if (fp && clean(fp.innerText)) return sanitizePhone(fp.innerText);
  return sanitizePhone(getField("Phone"));
}

function getOwnerValue() {
  return sanitizeOwner(getField("Owner"));
}

/* ---------------- Extractors ---------------- */
function extractLead() {
  return {
    id: location.pathname,
    name: getPrimaryName() || clean(getField("Name")),
    company: clean(getField("Company")),
    email: getEmailValue(),
    phone: getPhoneValue(),
    leadSource: sanitizeLeadSource(getField("Lead Source")),
    status: clean(getField("Lead Status")) || clean(getField("Status")),
    owner: sanitizeOwner(getField("Lead Owner") || getOwnerValue())
  };
}

function extractContact() {
  return {
    id: location.pathname,
    name: getPrimaryName() || clean(getField("Name")),
    email: getEmailValue(),
    phone: getPhoneValue(),
    account: clean(getField("Account Name") || getField("Account")),
    title: clean(getField("Title")),
    owner: sanitizeOwner(getField("Contact Owner") || getOwnerValue()),
    address: clean(getField("Mailing Address"))
  };
}

function extractAccount() {
  return {
    id: location.pathname,
    name: getPrimaryName() || clean(getField("Account Name") || getField("Name")),
    website: clean(getField("Website")),
    phone: getPhoneValue(),
    industry: clean(getField("Industry")),
    type: clean(getField("Type")),
    owner: sanitizeOwner(getField("Account Owner") || getOwnerValue()),
    revenue: clean(getField("Annual Revenue"))
  };
}

function extractOpportunity() {
  const rawStage = clean(getField("Stage"));
  const stage = normalizeStage(rawStage);

  return {
    id: location.pathname,
    name: getPrimaryName() || clean(getField("Opportunity Name") || getField("Name")),
    amount: clean(getField("Amount")),
    stage,
    stageRaw: rawStage,
    probability: clean(getField("Probability")),
    closeDate: clean(getField("Close Date")),
    forecast: clean(getField("Forecast Category")),
    owner: sanitizeOwner(getField("Opportunity Owner") || getOwnerValue()),
    account: clean(getField("Account Name"))
  };
}

function extractTask() {
  return {
    id: location.pathname,
    subject: getPrimaryName() || clean(getField("Subject")),
    due: clean(getField("Due Date") || getField("Activity Date")),
    status: clean(getField("Status")),
    priority: clean(getField("Priority")),
    relatedTo: clean(getField("Related To")),
    assignee: sanitizeOwner(getField("Assigned To") || getOwnerValue())
  };
}

/* ---------------- Stage Normalizer ---------------- */
function normalizeStage(stage) {
  const s = (stage || "").toLowerCase();
  if (!s) return "";
  if (s.includes("prospect")) return "Prospecting";
  if (s.includes("qualif")) return "Qualification";
  if (s.includes("proposal") || s.includes("value")) return "Proposal";
  if (s.includes("negoti")) return "Negotiation";
  if (s.includes("closed won")) return "Closed Won";
  if (s.includes("closed lost")) return "Closed Lost";
  if (s.includes("closed")) return "Closed";
  return stage;
}

/* ---------------- Controller ---------------- */
function extractCurrentObject() {
  const type = getObjectType();
  if (!type) {
    showIndicator("Unsupported Salesforce page", "#dc2626");
    return;
  }

  showIndicator(`Extracting ${type}...`, "#2563eb");

  let data;
  switch (type) {
    case "leads": data = extractLead(); break;
    case "contacts": data = extractContact(); break;
    case "accounts": data = extractAccount(); break;
    case "opportunities": data = extractOpportunity(); break;
    case "tasks": data = extractTask(); break;
  }

  chrome.runtime.sendMessage({ type: "SAVE_DATA", object: type, data }, () => {
    showIndicator(`Saved ${type} ✔`, "#16a34a");
  });
}
