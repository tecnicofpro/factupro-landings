// ============================================
// FACTUPRO — CONTACT MODAL (callback form)
// ============================================

(function () {
  'use strict';

  // ---- CONFIG ----
  // Crea tu formulario gratis en https://formspree.io
  // y pega aquí el endpoint (ej: https://formspree.io/f/xyzabcde)
  const FORM_ENDPOINT = 'https://formspree.io/f/XXXXXXXX';

  // ---- SELECTORS ----
  // Abre el modal cualquier botón que lleve href="#info", href="#asesor"
  // o que tenga el atributo data-modal="contact"
  const TRIGGER_SELECTORS = [
    'a[href="#info"]',
    'a[href="#asesor"]',
    '[data-modal="contact"]'
  ].join(',');

  // ---- INIT ----
  document.addEventListener('DOMContentLoaded', function () {
    injectModal();
    bindTriggers();
    bindClose();
  });

  function injectModal() {
    const modal = document.createElement('div');
    modal.id = 'fp-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'fp-modal-title');
    modal.innerHTML = `
      <div class="fp-modal-backdrop"></div>
      <div class="fp-modal-box">
        <button class="fp-modal-close" aria-label="Cerrar">&times;</button>

        <div class="fp-modal-state fp-modal-form-state">
          <p class="fp-modal-tag">Sin compromiso</p>
          <h2 class="fp-modal-title" id="fp-modal-title">Te llamamos nosotros</h2>
          <p class="fp-modal-sub">Déjanos tu nombre y teléfono. Un comercial te llama en menos de 24 h.</p>

          <form class="fp-modal-form" id="fp-contact-form" novalidate>
            <div class="fp-field">
              <label for="fp-name">Nombre</label>
              <input type="text" id="fp-name" name="nombre" placeholder="Tu nombre" required autocomplete="given-name" />
            </div>
            <div class="fp-field">
              <label for="fp-phone">Teléfono <span class="fp-required">*</span></label>
              <input type="tel" id="fp-phone" name="telefono" placeholder="+34 600 000 000" required autocomplete="tel" />
            </div>
            <div class="fp-field">
              <label for="fp-email">Email <span class="fp-optional">(opcional)</span></label>
              <input type="email" id="fp-email" name="email" placeholder="tu@email.com" autocomplete="email" />
            </div>

            <p class="fp-error" id="fp-error" hidden>Por favor, rellena los campos obligatorios.</p>

            <button type="submit" class="fp-submit" id="fp-submit">
              <span class="fp-submit-text">Que me llamen</span>
              <span class="fp-submit-loading" hidden>Enviando...</span>
            </button>

            <p class="fp-legal">
              Al enviar aceptas nuestra
              <a href="/politica-de-privacidad" target="_blank">política de privacidad</a>.
            </p>
          </form>
        </div>

        <div class="fp-modal-state fp-modal-success-state" hidden>
          <div class="fp-success-icon">✓</div>
          <h2 class="fp-modal-title">Recibido</h2>
          <p class="fp-modal-sub">Te llamamos en menos de 24 h en horario laboral. Puedes cerrar esta ventana.</p>
          <button class="btn fp-success-close">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function bindTriggers() {
    document.querySelectorAll(TRIGGER_SELECTORS).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
        if (window.__tracking) {
          window.__tracking.trackEvent('modal_open', { source: el.dataset.cta || 'unknown' });
        }
      });
    });
  }

  function bindClose() {
    const modal = document.getElementById('fp-modal');
    if (!modal) return;

    // X button
    modal.querySelector('.fp-modal-close').addEventListener('click', closeModal);

    // Backdrop click
    modal.querySelector('.fp-modal-backdrop').addEventListener('click', closeModal);

    // Success close button
    modal.querySelector('.fp-success-close').addEventListener('click', closeModal);

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // Form submit
    document.getElementById('fp-contact-form').addEventListener('submit', handleSubmit);
  }

  function openModal() {
    const modal = document.getElementById('fp-modal');
    if (!modal) return;
    modal.classList.add('fp-modal-open');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(function () {
      const first = modal.querySelector('input');
      if (first) first.focus();
    }, 100);
  }

  function closeModal() {
    const modal = document.getElementById('fp-modal');
    if (!modal) return;
    modal.classList.remove('fp-modal-open');
    document.body.style.overflow = '';
    // Reset form
    const form = document.getElementById('fp-contact-form');
    if (form) form.reset();
    // Reset states
    showFormState();
    hideError();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const phone = form.querySelector('#fp-phone').value.trim();
    const name = form.querySelector('#fp-name').value.trim();

    if (!phone || !name) {
      showError();
      return;
    }
    hideError();
    setLoading(true);

    const data = {
      nombre: name,
      telefono: phone,
      email: form.querySelector('#fp-email').value.trim(),
      landing: window.location.pathname,
      utms: window.__tracking ? window.__tracking.getStoredUTMs() : {}
    };

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (res.ok) {
          showSuccess();
          if (window.__tracking) {
            window.__tracking.trackEvent('lead_form_submit', { source: 'modal', telefono: phone });
          }
          if (window.fbq) window.fbq('track', 'Lead');
          if (window.gtag) window.gtag('event', 'generate_lead');
        } else {
          throw new Error('Error del servidor');
        }
      })
      .catch(function () {
        setLoading(false);
        showError('Ha ocurrido un error. Llámanos directamente.');
      });
  }

  function setLoading(on) {
    const btn = document.getElementById('fp-submit');
    if (!btn) return;
    btn.disabled = on;
    btn.querySelector('.fp-submit-text').hidden = on;
    btn.querySelector('.fp-submit-loading').hidden = !on;
  }

  function showSuccess() {
    document.querySelector('.fp-modal-form-state').hidden = true;
    document.querySelector('.fp-modal-success-state').hidden = false;
  }

  function showFormState() {
    document.querySelector('.fp-modal-form-state').hidden = false;
    document.querySelector('.fp-modal-success-state').hidden = true;
    setLoading(false);
  }

  function showError(msg) {
    const el = document.getElementById('fp-error');
    if (!el) return;
    el.textContent = msg || 'Por favor, rellena los campos obligatorios.';
    el.hidden = false;
  }

  function hideError() {
    const el = document.getElementById('fp-error');
    if (el) el.hidden = true;
  }

})();
