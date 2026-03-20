document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const themeToggle = document.querySelector(".theme-toggle");
  const themeIcon = document.querySelector(".theme-toggle__icon");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const successModal = createSuccessModal();

  setFooterYear();
  applyInitialTheme();
  highlightCurrentPage();
  setupMenu();
  setupThemeToggle();
  setupSmoothScroll();
  setupResourceFilters();
  setupForms();
  setMinimumDate();

  function setFooterYear() {
    document.querySelectorAll("[data-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function applyInitialTheme() {
    let storedTheme = null;
    try {
      storedTheme = localStorage.getItem("geh-theme");
    } catch (error) {
      storedTheme = null;
    }
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme || (systemPrefersDark ? "dark" : "light");
    applyTheme(theme);
  }

  function setupThemeToggle() {
    if (!themeToggle) {
      return;
    }

    themeToggle.addEventListener("click", () => {
      const nextTheme = body.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  }

  function applyTheme(theme, persist = false) {
    body.dataset.theme = theme;
    if (themeIcon) {
      themeIcon.textContent = theme === "dark" ? "☼" : "◐";
    }
    if (persist) {
      try {
        localStorage.setItem("geh-theme", theme);
      } catch (error) {
        // Ignore storage errors and keep the current in-memory theme.
      }
    }
  }

  function setupMenu() {
    if (!header || !menuToggle || !nav) {
      return;
    }

    menuToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      body.classList.toggle("no-scroll", isOpen && window.innerWidth < 960);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        body.classList.remove("no-scroll");
      });
    });

    document.addEventListener("click", (event) => {
      if (!header.classList.contains("is-open")) {
        return;
      }

      if (header.contains(event.target)) {
        return;
      }

      header.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      body.classList.remove("no-scroll");
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 960) {
        header.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        body.classList.remove("no-scroll");
      }
    });
  }

  function highlightCurrentPage() {
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const rawHref = link.getAttribute("href");
      if (!rawHref) {
        return;
      }

      const href = rawHref.split("#")[0] || "index.html";
      if (href === currentPage) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") {
          return;
        }

        const target = document.querySelector(targetId);
        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function setupResourceFilters() {
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
    const resourceCards = Array.from(document.querySelectorAll("[data-resource]"));

    if (!filterButtons.length || !resourceCards.length) {
      return;
    }

    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
      button.addEventListener("click", () => {
        const filter = button.dataset.filter || "all";

        filterButtons.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        resourceCards.forEach((card) => {
          const category = card.dataset.category;
          const shouldShow = filter === "all" || filter === category;
          card.classList.toggle("is-hidden", !shouldShow);
        });
      });
    });
  }

  function setupForms() {
    document.querySelectorAll("form[data-form-type]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearFormErrors(form);

        const errors = validateForm(form);
        if (errors.length) {
          const firstField = form.querySelector(".has-error input, .has-error select, .has-error textarea");
          const status = form.querySelector(".form-status");
          if (status) {
            status.textContent = errors[0];
          }
          if (firstField) {
            firstField.focus();
          }
          return;
        }

        const formType = form.dataset.formType;
        const heading = formType === "booking" ? "Booking request received" : "Message received";
        const message =
          formType === "booking"
            ? "Your request has been captured. A counselor can follow up with study options, your preferred date, and next steps."
            : "Your message has been captured. We can now follow up by email or WhatsApp with the details you requested.";

        form.reset();
        const status = form.querySelector(".form-status");
        if (status) {
          status.textContent = "";
        }

        successModal.show(heading, message);
      });
    });
  }

  function clearFormErrors(form) {
    form.querySelectorAll(".field").forEach((field) => field.classList.remove("has-error"));
    form.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
    const status = form.querySelector(".form-status");
    if (status) {
      status.textContent = "";
    }
  }

  function validateForm(form) {
    const messages = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    form.querySelectorAll("[required]").forEach((input) => {
      const field = input.closest(".field");
      const errorNode = field ? field.querySelector(".field-error") : null;
      const value = input.value.trim();

      if (!value) {
        if (field) {
          field.classList.add("has-error");
        }
        if (errorNode) {
          errorNode.textContent = "This field is required.";
        }
        messages.push("Please complete all required fields.");
        return;
      }

      if (input.type === "email" && !emailPattern.test(value)) {
        if (field) {
          field.classList.add("has-error");
        }
        if (errorNode) {
          errorNode.textContent = "Enter a valid email address.";
        }
        messages.push("Please enter a valid email address.");
      }

      if (input.type === "date") {
        const chosenDate = new Date(`${value}T00:00:00`);
        if (chosenDate < today) {
          if (field) {
            field.classList.add("has-error");
          }
          if (errorNode) {
            errorNode.textContent = "Choose today or a future date.";
          }
          messages.push("Preferred date must be today or later.");
        }
      }
    });

    const messageField = form.querySelector("textarea[required]");
    if (messageField && messageField.value.trim() && messageField.value.trim().length < 12) {
      const field = messageField.closest(".field");
      const errorNode = field ? field.querySelector(".field-error") : null;
      if (field) {
        field.classList.add("has-error");
      }
      if (errorNode) {
        errorNode.textContent = "Add a little more detail so we can respond clearly.";
      }
      messages.push("Please provide a more detailed message.");
    }

    return messages;
  }

  function setMinimumDate() {
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      input.min = `${yyyy}-${mm}-${dd}`;
    });
  }

  function createSuccessModal() {
    const modal = document.createElement("div");
    modal.className = "success-modal";
    modal.innerHTML = `
      <div class="success-modal__panel" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
        <h3 id="success-modal-title">Success</h3>
        <p id="success-modal-copy"></p>
        <div class="success-modal__actions">
          <button class="btn btn-primary" type="button" data-close-modal>Continue</button>
        </div>
      </div>
    `;

    body.appendChild(modal);

    const title = modal.querySelector("#success-modal-title");
    const copy = modal.querySelector("#success-modal-copy");

    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-close-modal]")) {
        modal.classList.remove("is-visible");
        body.classList.remove("no-scroll");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        modal.classList.remove("is-visible");
        body.classList.remove("no-scroll");
      }
    });

    return {
      show(heading, message) {
        if (title) {
          title.textContent = heading;
        }
        if (copy) {
          copy.textContent = message;
        }
        modal.classList.add("is-visible");
        body.classList.add("no-scroll");
      },
    };
  }
});
