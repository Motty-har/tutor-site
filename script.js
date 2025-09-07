// ===== Footer year
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

// ===== EmailJS (replace with your values)
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";

window.addEventListener("load", () => {
  if (window.emailjs && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
});

// ===== Toast helper
function showToast(msg, type = "ok") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.hidden = false;
  setTimeout(() => (t.hidden = true), 6000);
}

// ===== Collect helper
function collectChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(el => el.value);
}

// ===== Validate form
function validateForm(form) {
  const email = form.from_email.value.trim();
  const name = form.from_name.value.trim();
  const message = form.message.value.trim();
  const lessonType = form.lesson_type.value;

  if (form.website.value !== "") return { ok: false, reason: "Spam bot detected." }; // honeypot
  if (!name) return { ok: false, reason: "Please enter your name." };
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, reason: "Please enter a valid email." };
  if (!lessonType) return { ok: false, reason: "Please select a lesson type." };
  if (lessonType === "Other" && !(form.other_subject.value || "").trim()) {
    return { ok: false, reason: "Please describe the ‘Other’ subject." };
  }
  if (!message || message.length < 10) return { ok: false, reason: "Please provide a brief message (10+ chars)." };
  if (!form.consent.checked) return { ok: false, reason: "Please consent to be contacted." };

  const days = collectChecked("days");
  if (days.length === 0) return { ok: false, reason: "Please select at least one preferred day." };
  // Optional: ensure time range makes sense if both provided
  if (form.time_from.value && form.time_to.value && form.time_from.value >= form.time_to.value) {
    return { ok: false, reason: "Please set a valid time range (Earliest before Latest)." };
  }

  return { ok: true };
}

// ===== Subjects modal + prefill
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".subject");
  const modal = document.getElementById("subject-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalInquire = document.getElementById("modal-inquire");
  const closeEls = document.querySelectorAll("[data-close-modal]");
  const select = document.getElementById("lesson_type");
  const subjectArea = document.getElementById("subject_area");
  const otherWrap = document.getElementById("other-wrapper");
  const otherInput = document.getElementById("other_subject");

  function openModal(title, info, card) {
    modalTitle.textContent = title;
    modalBody.textContent = info;
    modal.setAttribute("aria-hidden", "false");
    modal.dataset.subjectType = card?.dataset.type || "";
    modal.dataset.subjectArea = card?.dataset.subjectarea || "";
  }
  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    delete modal.dataset.subjectType;
    delete modal.dataset.subjectArea;
  }

  cards.forEach(card => {
    card.addEventListener("click", () => {
      openModal(card.dataset.type, card.dataset.info || "", card);
    });
  });

  closeEls.forEach(el => el.addEventListener("click", closeModal));
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal__backdrop")) closeModal();
  });

  modalInquire.addEventListener("click", () => {
    const type = modal.dataset.subjectType || "";
    const area = modal.dataset.subjectArea || "";
    if (select) {
      select.value = type || "";
      select.dispatchEvent(new Event("change"));
    }
    if (area && subjectArea) subjectArea.value = area;
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    closeModal();
  });

  // Show/hide Other field
  function syncOther() {
    const isOther = select && select.value === "Other";
    if (otherWrap) otherWrap.hidden = !isOther;
    if (otherInput) {
      otherInput.required = !!isOther;
      if (!isOther) otherInput.value = "";
    }
  }
  if (select) {
    select.addEventListener("change", syncOther);
    syncOther();
  }
});

// ===== Handle form submit
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inquiry-form");
  const submitBtn = document.getElementById("submit-btn");
  const successCard = document.getElementById("success-card");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const check = validateForm(form);
    if (!check.ok) {
      showToast(check.reason, "err");
      return;
    }

    const days = collectChecked("days");
    const timeFrom = form.time_from.value || "";
    const timeTo = form.time_to.value || "";
    const timeZone = "America/New_York";

    submitBtn.disabled = true;
    try {
      if (!window.emailjs) throw new Error("EmailJS SDK not loaded");

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: form.from_name.value,
        from_email: form.from_email.value,
        phone: form.phone.value,
        lesson_type: form.lesson_type.value,
        subject_area: form.subject_area.value,
        other_subject: form.other_subject ? form.other_subject.value : "",
        // Availability
        days: days.join(", "),
        time_from: timeFrom,
        time_to: timeTo,
        time_zone: timeZone,
        // Message
        message: form.message.value
      });

      form.reset();
      // Flip to success screen
      form.hidden = true;
      if (successCard) successCard.hidden = false;
      showToast("Submitted! Expect a response within 24 hours.", "ok");
    } catch (err) {
      console.error(err);
      showToast("Sorry—couldn’t send right now. You can try again or email me directly.", "err");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
