// ====== CONFIG ======
const EMAILJS_PUBLIC_KEY = "KVXiqfKbKCFpkH6TP";   // your real public key
const EMAILJS_SERVICE_ID = "service_n56wx83";     // Gmail service ID
const EMAILJS_TEMPLATE_ID = "template_8cump19";   // Contact Us template (includes autoreply)
// =====================

(function () {
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const form        = $('#inquiry-form');
  const toast       = $('#toast');
  const successCard = $('#success-card');
  const submitBtn   = $('#submit-btn');
  const lessonType  = $('#lesson_type');
  const otherWrapper= $('#other-wrapper');
  const otherSubject= $('#other_subject');

  // Init EmailJS
  document.addEventListener('DOMContentLoaded', () => {
    if (window.emailjs) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      console.log("✅ EmailJS initialized");
    }
  });

  // Toggle "Other" field
  lessonType.addEventListener('change', () => {
    const showOther = lessonType.value === 'Other';
    otherWrapper.hidden = !showOther;
    if (showOther) {
      otherSubject.setAttribute('required', 'required');
    } else {
      otherSubject.removeAttribute('required');
      otherSubject.value = '';
    }
  });

  function showToast(msg, ok = true) {
    toast.textContent = msg;
    toast.className = `toast ${ok ? 'ok' : 'err'}`;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 5000);
  }

  function gatherPreferredDays() {
    return $$('input[name="preferred_days"]:checked').map(b => b.value).join(', ');
  }

  function validateForm() {
    const requiredIds = [
      'parent_first','parent_last','from_email','student_name',
      'student_grade','lesson_type','preferred_times','modality','consent'
    ];
    for (const id of requiredIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === 'checkbox' && !el.checked) return false;
      if (el.value.trim() === '') return false;
    }
    if (lessonType.value === 'Other' && otherSubject.value.trim() === '') return false;
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please complete all required fields.", false);
      return;
    }

    const parent_name = `${$('#parent_first').value.trim()} ${$('#parent_last').value.trim()}`;
    const payload = {
      parent_name,
      from_email: $('#from_email').value.trim(),
      phone: $('#phone').value.trim(),
      student_name: $('#student_name').value.trim(),
      student_grade: $('#student_grade').value,
      lesson_type: lessonType.value,
      other_subject: otherSubject.value.trim(),
      preferred_days: gatherPreferredDays(),
      preferred_times: $('#preferred_times').value.trim(),
      modality: $('#modality').value,
      message: $('#message').value.trim(),
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const res = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
      console.log("EmailJS response:", res);

      form.reset();
      otherWrapper.hidden = true;
      showToast("Sent! I’ll reply within 24 hours.", true);
      successCard.hidden = false;
      successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error(err);
      showToast("Sending failed. Check console for details.", false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Inquiry";
    }
  });
})();
