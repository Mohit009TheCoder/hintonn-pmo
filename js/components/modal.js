// ─── Modal Component ───
const Modal = {
  _stack: [],

  open(title, bodyHtml, footerHtml, opts = {}) {
    this.closeAll();
    const id = 'modal-' + Date.now();
    const size = opts.large ? 'modal-lg' : '';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    overlay.onclick = (e) => { if (e.target === overlay) this.close(id); };
    overlay.innerHTML = `
      <div class="modal ${size}">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" onclick="Modal.close('${id}')">${Icons.x}</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>`;
    document.body.appendChild(overlay);
    this._stack.push(id);
    const firstInput = overlay.querySelector('input, textarea, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
    return id;
  },

  close(id) {
    const el = document.getElementById(id);
    if (el) { el.remove(); this._stack = this._stack.filter(s => s !== id); }
  },

  closeAll() { 
    this._stack.forEach(id => { const el = document.getElementById(id); if(el) el.remove(); }); 
    this._stack = []; 
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
  },

  confirm(title, message, onConfirm, opts = {}) {
    // Close any existing modals first to prevent stacking
    this.closeAll();
    const id = this.open(title, `<p style="font-size:14px;color:var(--color-text-secondary);line-height:1.6">${message}</p>`,
      `<button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
       <button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm-btn">${opts.confirmText || 'Confirm'}</button>`);
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const closeBtn = document.getElementById(id).querySelector('.modal-close');
    confirmBtn.onclick = () => { this.close(id); onConfirm(); };
    if (closeBtn) closeBtn.onclick = () => this.close(id);
    if (cancelBtn) cancelBtn.onclick = () => this.close(id);
  }
};
