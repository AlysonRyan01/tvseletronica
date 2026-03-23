/* ====================================================
   TVS Eletrônica — API Client
   ===================================================== */

const API = {
  EMAIL_BASE: "https://tvs-api.azurewebsites.net/",
  OS_BASE: "https://gerenciamentotvsapi-f7e9dyhyfbhrbpa8.brazilsouth-01.azurewebsites.net/",
  TIMEOUT: 60_000,

  async _fetch(base, path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT);
    try {
      const res = await fetch(base + path, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
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

  /* ---- Email ---- */
  async sendEmail({ name, subject, body, attachments = [] }) {
    return this._fetch(this.EMAIL_BASE, "api/contato", {
      method: "POST",
      body: JSON.stringify({ name, subject, body, attachments }),
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

/* ---- File to Base64 helper ---- */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        fileName: file.name,
        contentType: file.type,
        base64: reader.result.split(",")[1],
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
window.fileToBase64 = fileToBase64;

/* ---- Contact Form Handler (shared) ---- */
async function handleContactForm({
  formId,
  btnId,
  subject,
  onSuccess,
  extraValidation,
  buildBody,
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

    const body = buildBody
      ? buildBody({ name, phone, email, message })
      : `Nome: ${name}\nTelefone: ${phone}\nEmail: ${email || "Não informado"}\nMensagem: ${message}`;

    const files = attachments ? await attachments() : [];

    const result = await API.sendEmail({
      name,
      subject,
      body,
      attachments: files,
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
