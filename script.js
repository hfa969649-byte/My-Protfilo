document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const page = body.dataset.page || 'home';

  const themeBtn = document.getElementById('themeToggle');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');

  // Theme
  const savedTheme = localStorage.getItem('ma-theme') || 'dark';
  applyTheme(savedTheme);

  themeBtn?.addEventListener('click', () => {
    const next = body.classList.contains('light') ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('ma-theme', next);
  });

  function applyTheme(theme) {
    const isLight = theme === 'light';
    body.classList.toggle('light', isLight);
    if (sunIcon && moonIcon) {
      sunIcon.classList.toggle('hidden', !isLight);
      moonIcon.classList.toggle('hidden', isLight);
    }
  }

  // Mobile menu
  menuToggle?.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu?.classList.remove('open');
      menuToggle?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  // Navbar and back-to-top
  const setUiState = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 60);
    backToTop?.classList.toggle('visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', setUiState, { passive: true });
  setUiState();

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Active nav link per page
  document.querySelectorAll('.nav-link, .mob-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Reveal animations
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => revealObs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // Skill bars
  const skillBars = document.querySelectorAll('.skbar');
  if ('IntersectionObserver' in window && skillBars.length) {
    const barObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.skbar-fill');
          const pct = entry.target.getAttribute('data-pct');
          if (fill && pct) {
            setTimeout(() => { fill.style.width = pct + '%'; }, 250);
          }
          barObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });

    skillBars.forEach(bar => barObs.observe(bar));
  }

  // Project filter
  const filterBtns = document.querySelectorAll('.fbtn');
  const cards = document.querySelectorAll('.pcard');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(x => x.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.cat === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  // Contact validation
  const form = document.getElementById('contactForm');
  const successMsg = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');
  const replyToField = document.getElementById('replyToField');
  const draftKey = 'ma-contact-draft';
  const sentKey = 'ma-contact-last-sent';

  if (form) {
    const fields = [
      {
        input: document.getElementById('fname'),
        error: document.getElementById('fnameErr'),
        validate: v => v.trim().length >= 2,
      },
      {
        input: document.getElementById('femail'),
        error: document.getElementById('femailErr'),
        validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      },
      {
        input: document.getElementById('fmsg'),
        error: document.getElementById('fmsgErr'),
        validate: v => v.trim().length >= 10,
      },
    ];


    const getFieldValues = () => ({
      name: document.getElementById('fname')?.value || '',
      email: document.getElementById('femail')?.value || '',
      subject: document.getElementById('fsubject')?.value || '',
      message: document.getElementById('fmsg')?.value || '',
    });

    const saveDraft = () => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(getFieldValues()));
      } catch (_) {}
    };

    const restoreDraft = () => {
      try {
        const raw = localStorage.getItem(draftKey);
        if (!raw) return;
        const draft = JSON.parse(raw);
        const setValue = (id, value) => {
          const el = document.getElementById(id);
          if (el && typeof value === 'string') el.value = value;
        };
        setValue('fname', draft.name);
        setValue('femail', draft.email);
        setValue('fsubject', draft.subject);
        setValue('fmsg', draft.message);
      } catch (_) {}
    };

    restoreDraft();

    const clearErr = (input, error) => {
      if (!input || !error) return;
      input.classList.remove('error');
      error.classList.add('hidden');
    };

    const checkField = (input, error, validate) => {
      if (!validate(input.value)) {
        input.classList.add('error');
        error.classList.remove('hidden');
        return false;
      }
      clearErr(input, error);
      return true;
    };

    fields.forEach(({ input, error, validate }) => {
      if (!input) return;
      input.addEventListener('blur', () => checkField(input, error, validate));
      input.addEventListener('input', () => {
        if (validate(input.value)) clearErr(input, error);
        saveDraft();
      });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const allOk = fields.every(({ input, error, validate }) => checkField(input, error, validate));
      if (!allOk) return;

      if (replyToField) {
        replyToField.value = document.getElementById('femail')?.value.trim() || '';
      }

      if (submitBtn) {
        submitBtn.textContent = 'Sending…';
        submitBtn.disabled = true;
      }

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Submission failed');
        }

        const lastSent = {
          ...getFieldValues(),
          sentAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(sentKey, JSON.stringify(lastSent));
          localStorage.removeItem(draftKey);
        } catch (_) {}

        form.reset();
        successMsg?.classList.remove('hidden');
        if (submitBtn) {
          submitBtn.textContent = 'Send Message ↗';
          submitBtn.disabled = false;
        }

        setTimeout(() => successMsg?.classList.add('hidden'), 5000);
      } catch (error) {
        if (successMsg) {
          const originalMessage = '✓ Message sent to my inbox! I\'ll get back to you soon.';
          successMsg.textContent = '✗ Sorry, the message could not be sent right now. Please try again.';
          successMsg.classList.remove('hidden');
          setTimeout(() => {
            successMsg.textContent = originalMessage;
          }, 2000);
        }
        if (submitBtn) {
          submitBtn.textContent = 'Send Message ↗';
          submitBtn.disabled = false;
        }
      }
    });
  }
});
