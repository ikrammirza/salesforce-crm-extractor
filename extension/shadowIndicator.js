export function showIndicator(text, color = "green") {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "10px";
  host.style.right = "10px";
  host.style.zIndex = "999999";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      .box {
        background: ${color};
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
      }
    </style>
    <div class="box">${text}</div>
  `;

  setTimeout(() => host.remove(), 3000);
}
