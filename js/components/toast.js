// ─── Toast Component ───
const Toast = {
  show(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const icons = { success: Icons.check, error: Icons.x, info: Icons.alertCircle };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">${Icons.x}</button>`;
    container.appendChild(el);
    setTimeout(() => { if (el.parentElement) el.remove(); }, duration);
  }
};
