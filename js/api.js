/* ====================================================
   TVS Eletrônica — API Client
   ===================================================== */

const API = {
  OS_BASE: "https://gerenciamento.tvseletronica.com/api/",
  TIMEOUT: 60_000,

  async _fetch(base, path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT);
    try {
      const res = await fetch(base + path, {
        ...options,
        signal: controller.signal,
        headers: {
          // FormData define o próprio Content-Type (multipart com boundary)
          ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);

      if (!res.ok) {
        const map = {
          404: "Serviço indisponível.",
          401: "Credenciais inválidas.",
          400: "Dados incorretos.",
          503: "Erro no servidor.",
        };
        return {
          success: false,
          message: map[res.status] || `Erro ${res.status}.`,
        };
      }

      const data = await res.json().catch(() => null);
      return { success: true, data };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError")
        return {
          success: false,
          message: "Tempo de conexão esgotado. Tente novamente.",
        };
      return {
        success: false,
        message: "Falha na conexão. Verifique sua internet.",
      };
    }
  },

  /* ---- WhatsApp (contato do site → WhatsApp da loja) ---- */
  async sendWhatsApp({ subject, name, phone, email, message, files = [] }) {
    const fd = new FormData();
    fd.append("subject", subject || "");
    fd.append("name", name);
    fd.append("phone", phone);
    fd.append("email", email || "");
    fd.append("message", message || "");
    files.forEach((f) => fd.append("files", f, f.name));
    return this._fetch(this.OS_BASE, "v1/whatsapp/site-contact", {
      method: "POST",
      body: fd,
    });
  },

  /* ---- Service Orders ---- */
  async getServiceOrder(id, code) {
    return this._fetch(
      this.OS_BASE,
      `get-service-order-for-customer/${id}/${code}`,
    );
  },

  async approveEstimate(id, code) {
    return this._fetch(this.OS_BASE, "add-service-order-approve-estimate", {
      method: "PUT",
      body: JSON.stringify({ id, code }),
    });
  },

  async rejectEstimate(id, code) {
    return this._fetch(this.OS_BASE, "add-service-order-reject-estimate", {
      method: "PUT",
      body: JSON.stringify({ id, code }),
    });
  },
};

window.API = API;

/* ---- Contact Form Handler (shared) ---- */
async function handleContactForm({
  formId,
  btnId,
  subject,
  onSuccess,
  extraValidation,
  buildMessage,
  attachments,
}) {
  const form = document.getElementById(formId);
  const btn = document.getElementById(btnId);
  if (!form || !btn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector("[name=name]")?.value?.trim();
    const phone = form.querySelector("[name=phone]")?.value?.trim();
    const email = form.querySelector("[name=email]")?.value?.trim();
    const message = form.querySelector("[name=message]")?.value?.trim();

    if (!name || !phone) {
      Toast.error("Nome e telefone são obrigatórios.");
      return;
    }
    if (email && !email.includes("@")) {
      Toast.error("E-mail inválido.");
      return;
    }
    if (extraValidation && !extraValidation()) return;

    const originalText = btn.textContent;
    btn.style.display = "none";

    const spinnerEl = document.createElement("div");
    spinnerEl.className = "spinner";
    spinnerEl.style.margin = "8px auto";
    btn.parentNode.insertBefore(spinnerEl, btn.nextSibling);

    const files = attachments ? attachments() : [];

    const result = await API.sendWhatsApp({
      subject,
      name,
      phone,
      email,
      message: buildMessage ? buildMessage({ message }) : message,
      files,
    });

    spinnerEl.remove();
    btn.style.display = "";

    if (result.success) {
      Toast.success(
        "Mensagem enviada com sucesso! Entraremos em contato em breve.",
      );
      form.reset();
      document
        .querySelectorAll(".upload-files")
        .forEach((el) => (el.innerHTML = ""));
      if (onSuccess) onSuccess();
      startCooldown(btn, 2);
    } else {
      Toast.error(result.message || "Erro ao enviar. Tente novamente.");
    }
  });
}

window.handleContactForm = handleContactForm;
