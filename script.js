/* ==========================================================
   PREMIUM DEVELOPER PORTFOLIO — script.js
   Vanilla JavaScript · No frameworks · Beginner friendly
   ========================================================== */

/* ==========================================================
   SOUND EFFECT CONFIGURATION
   Replace these filenames with your own files.
   Example: click: "assets/sounds/button.wav"
   ========================================================== */
const soundFiles = {
    intro: "assets/sounds/intro.mp3",
    click: "assets/sounds/click.mp3",
    hover: "assets/sounds/hover.mp3",
    menu:  "assets/sounds/menu.mp3",
    open:  "assets/sounds/open.mp3",
    close: "assets/sounds/close.mp3"
};

/* Central volume setting.
   0.15 = very quiet · 0.35 = normal · 0.50 = stronger */
const SOUND_VOLUME = 0.35;

/* ==========================================================
   SOUND SYSTEM
   - Fails silently if a file is missing
   - Respects browser autoplay rules (unlocks on first gesture)
   - Sound can be fully disabled (stored in localStorage)
   ========================================================== */
const SoundSystem = (function () {
    // Build Audio objects from the config above
    const sounds = {};
    Object.keys(soundFiles).forEach((key) => {
        try {
            const audio = new Audio(soundFiles[key]);
            audio.preload = "auto";
            audio.volume = SOUND_VOLUME;
            sounds[key] = audio;
        } catch (e) {
            sounds[key] = null; // missing/invalid file — website keeps working
        }
    });

    // Preference persisted across visits
    const STORAGE_KEY = "portfolio_sound_enabled";
    let enabled = localStorage.getItem(STORAGE_KEY) !== "off"; // default ON

    // Tracks the most recently played sound to reduce overlap
    let lastPlayedAt = 0;

    function play(name) {
        if (!enabled) return;
        const sound = sounds[name];
        if (!sound) return;

        try {
            sound.volume = SOUND_VOLUME;
            sound.currentTime = 0; // restart even if triggered rapidly
            const promise = sound.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(() => {}); // autoplay blocked / file missing → ignore
            }
            lastPlayedAt = Date.now();
        } catch (e) {
            /* never break the site because of a sound */
        }
    }

    // Hover sounds get a small cooldown so they don't repeat
    // while the cursor stays over an element.
    const HOVER_COOLDOWN_MS = 350;
    function playHover() {
        if (Date.now() - lastPlayedAt < HOVER_COOLDOWN_MS) return;
        play("hover");
    }

    return {
        playIntro: () => play("intro"),
        playClick: () => play("click"),
        playHover,
        playMenu:  () => play("menu"),
        playOpen:  () => play("open"),
        playClose: () => play("close"),
        isEnabled: () => enabled,
        toggle() {
            enabled = !enabled;
            localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
            return enabled;
        }
    };
})();

/* Convenience wrappers (same API as requested in the brief) */
const playIntroSound = SoundSystem.playIntro;
const playClickSound = SoundSystem.playClick;
const playHoverSound = SoundSystem.playHover;
const playMenuSound  = SoundSystem.playMenu;
const playOpenSound  = SoundSystem.playOpen;
const playCloseSound = SoundSystem.playClose;

/* ==========================================================
   DOM READY — everything below runs after the page parses
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    /* ======================================================
       PAGE LOADER (≤ ~2 seconds, fades out and reveals hero)
       ====================================================== */
    (function initLoader() {
        const loader = document.getElementById("loader");
        const fill = document.getElementById("loaderBarFill");
        const pct = document.getElementById("loaderPercent");
        let progress = 0;
        const DURATION = prefersReducedMotion ? 100 : 1400; // ms
        const started = performance.now();

        function tick(now) {
            progress = Math.min(100, Math.round(((now - started) / DURATION) * 100));
            fill.style.width = progress + "%";
            pct.textContent = progress + "%";
            if (progress < 100) {
                requestAnimationFrame(tick);
            } else {
                loader.classList.add("done");
                document.body.classList.add("loaded"); // starts hero animations
                setTimeout(() => loader.remove(), 700);
            }
        }
        requestAnimationFrame(tick);
    })();

    /* ======================================================
       INTRO SOUND — plays on load; if the browser blocks
       autoplay, it plays on the visitor's very first
       click/tap/keypress anywhere on the page instead.
       ====================================================== */
    (function initIntroSound() {
        let hasPlayed = false;

        function tryPlayIntro() {
            if (hasPlayed || !SoundSystem.isEnabled()) return;
            hasPlayed = true; // only ever attempt once
            playIntroSound();
        }

        // Attempt 1: as soon as the page finishes loading
        tryPlayIntro();

        // Attempt 2 (fallback): most browsers block sound until the
        // user interacts with the page — this catches that first gesture.
        const unlockEvents = ["click", "keydown", "touchstart"];
        function onFirstGesture() {
            tryPlayIntro();
            unlockEvents.forEach(evt => document.removeEventListener(evt, onFirstGesture));
        }
        unlockEvents.forEach(evt => document.addEventListener(evt, onFirstGesture));
    })();

    /* ======================================================
       SOUND TOGGLE (nav button + localStorage preference)
       ====================================================== */
    (function initSoundToggle() {
        const btn = document.getElementById("soundToggle");
        const icon = document.getElementById("soundIcon");
        const label = document.getElementById("soundLabel");

        function render() {
            const on = SoundSystem.isEnabled();
            icon.className = on ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
            label.textContent = on ? "SOUND ON" : "SOUND OFF";
            btn.setAttribute("aria-label", on ? "Disable sound" : "Enable sound");
            btn.setAttribute("aria-pressed", String(on));
        }
        render();

        btn.addEventListener("click", () => {
            const nowOn = SoundSystem.toggle();
            render();
            if (nowOn) playClickSound(); // immediate feedback when re-enabled
        });
    })();

    /* ======================================================
       NAVIGATION — sticky style, active link, smooth scroll
       ====================================================== */
    const navbar = document.getElementById("navbar");
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = [...document.querySelectorAll("main section[id]")];

    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 40);
    }, { passive: true });

    // Active section indicator via IntersectionObserver
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((l) => l.classList.toggle(
                "active", l.getAttribute("href") === "#" + entry.target.id
            ));
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => navObserver.observe(s));

    /* ======================================================
       GLOBAL CLICK / HOVER SOUND BINDINGS
       Elements with .nav-sound-click play click.mp3.
       Elements with [data-hover-sound], nav links, cards play hover.mp3.
       ====================================================== */
    document.querySelectorAll(".nav-sound-click, .nav-link").forEach((el) => {
        el.addEventListener("click", playClickSound);
    });
    const hoverables = document.querySelectorAll(
        ".nav-link, [data-hover-sound], .btn-gold, .btn-ghost, .skill-card, .project-link"
    );
    hoverables.forEach((el) => el.addEventListener("mouseenter", playHoverSound));

    /* ======================================================
       MOBILE MENU — hamburger open/close with menu.mp3
       ====================================================== */
    (function initMobileMenu() {
        const hamburger = document.getElementById("hamburger");
        const menu = document.getElementById("navLinks");

        function setMenu(open) {
            hamburger.classList.toggle("open", open);
            menu.classList.toggle("open", open);
            hamburger.setAttribute("aria-expanded", String(open));
            hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            document.body.style.overflow = open ? "hidden" : "";
        }

        hamburger.addEventListener("click", () => {
            playMenuSound();
            setMenu(!menu.classList.contains("open"));
        });

        // Close menu after tapping a link (mobile)
        menu.querySelectorAll("a").forEach((a) =>
            a.addEventListener("click", () => setMenu(false))
        );

        // Close with Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && menu.classList.contains("open")) {
                setMenu(false);
                hamburger.focus();
            }
        });
    })();

    /* ======================================================
       TYPEWRITER — rotating hero roles
       ====================================================== */
    (function initTypewriter() {
        const el = document.getElementById("typewriter");
        const roles = [
            "FULL STACK DEVELOPER",
            "SOFTWARE DEVELOPER",
            "MACHINE LEARNING ENTHUSIAST",
            "PROBLEM SOLVER"
        ];
        if (prefersReducedMotion) { el.textContent = roles[0]; return; }

        let roleIndex = 0, charIndex = 0, deleting = false;
        const TYPE_MS = 65, DELETE_MS = 32, HOLD_MS = 1600;

        function step() {
            const word = roles[roleIndex];
            if (!deleting) {
                charIndex++;
                el.textContent = word.slice(0, charIndex);
                if (charIndex === word.length) { deleting = true; return setTimeout(step, HOLD_MS); }
                return setTimeout(step, TYPE_MS);
            }
            charIndex--;
            el.textContent = word.slice(0, charIndex);
            if (charIndex === 0) { deleting = false; roleIndex = (roleIndex + 1) % roles.length; }
            setTimeout(step, DELETE_MS);
        }
        setTimeout(step, 1200); // let the loader finish first
    })();

    /* ======================================================
       SCROLL ANIMATIONS — IntersectionObserver reveals
       ====================================================== */
    (function initReveals() {
        const revealEls = document.querySelectorAll(".reveal");
        if (prefersReducedMotion) {
            revealEls.forEach((el) => el.classList.add("in-view"));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach((el) => io.observe(el));

        // Timeline line grows when the timeline enters view
        const timeline = document.querySelector(".timeline");
        if (timeline) {
            const tio = new IntersectionObserver((entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) { timeline.classList.add("in-view"); tio.disconnect(); }
                });
            }, { threshold: 0.1 });
            tio.observe(timeline);
        }
    })();

    /* ======================================================
       STAT COUNTERS — animate numbers in the About section
       ====================================================== */
    (function initCounters() {
        const numbers = document.querySelectorAll(".stat-number");
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10);
                if (prefersReducedMotion) { el.textContent = target; io.unobserve(el); return; }
                const DURATION = 1400;
                const start = performance.now();
                (function count(now) {
                    const p = Math.min(1, (now - start) / DURATION);
                    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); // ease-out cubic
                    if (p < 1) requestAnimationFrame(count);
                })(start);
                io.unobserve(el);
            });
        }, { threshold: 0.6 });
        numbers.forEach((n) => io.observe(n));
    })();

    /* ======================================================
       SKILL BARS — fill + percentage count when visible
       ====================================================== */
    (function initSkills() {
        const cards = document.querySelectorAll("[data-skill]");
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const card = entry.target;
                const fill = card.querySelector(".skill-fill");
                const pctEl = card.querySelector(".skill-pct");
                const target = parseInt(pctEl.dataset.progress, 10);
                fill.style.width = target + "%";
                if (prefersReducedMotion) { pctEl.textContent = target + "%"; }
                else {
                    const DURATION = 1300;
                    const start = performance.now();
                    (function count(now) {
                        const p = Math.min(1, (now - start) / DURATION);
                        pctEl.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + "%";
                        if (p < 1) requestAnimationFrame(count);
                    })(start);
                }
                io.unobserve(card);
            });
        }, { threshold: 0.5 });
        cards.forEach((c) => io.observe(c));
    })();

    /* ======================================================
       PROJECT MODAL — open.mp3 / close.mp3, Escape support
       EDIT the project data below with your real content/links.
       ====================================================== */
    const PROJECTS = {
        p1: {
            title: "Bike Rental Management System",
            category: "FULL STACK WEB APP",
            image: "assets/images/project1.jpg",
            icon: "fa-solid fa-bicycle",
            desc: "A complete bike rental platform that lets customers browse, book and return bikes online, while administrators manage the fleet, pricing and bookings from a secure dashboard.",
            features: [
                "Online booking with real-time availability",
                "Admin dashboard for bikes, customers and payments",
                "Secure login and role-based access",
                "Rental history and invoice generation",
                "Fully responsive Bootstrap interface"
            ],
            tech: ["HTML", "CSS", "Bootstrap", "PHP", "MySQL"],
            github: "#",
            demo: "#"
        },
        p2: {
            title: "Breast Cancer Prediction Using Machine Learning",
            category: "MACHINE LEARNING",
            image: "assets/images/project2.jpg",
            icon: "fa-solid fa-brain",
            desc: "A machine learning project that predicts whether a tumor is benign or malignant using clinical measurements, with a full data-science workflow from exploration to evaluation.",
            features: [
                "Exploratory data analysis and visualisation",
                "Feature scaling and selection",
                "Multiple classifiers compared (Logistic Regression, SVM, Random Forest)",
                "Confusion matrix, accuracy and ROC evaluation",
                "Reproducible Jupyter notebook pipeline"
            ],
            tech: ["Python", "Pandas", "Scikit-learn", "Machine Learning"],
            github: "#",
            demo: "#"
        },
        p3: {
            title: "Personal Developer Portfolio",
            category: "FRONTEND",
            image: "assets/images/project3.jpg",
            icon: "fa-solid fa-laptop-code",
            desc: "This very website — a premium, fully responsive personal portfolio with custom scroll animations, a typewriter hero, interactive sound design and a project showcase modal.",
            features: [
                "Custom-built with HTML, CSS and vanilla JavaScript",
                "Interactive sound system with ON/OFF preference",
                "Scroll-triggered reveal animations",
                "Custom cursor and project detail modal",
                "Accessible and fully responsive"
            ],
            tech: ["HTML", "CSS", "JavaScript"],
            github: "#",
            demo: "#"
        }
    };

    (function initProjectModal() {
        const overlay = document.getElementById("projectModal");
        const box = overlay.querySelector(".modal-box");
        const closeBtn = document.getElementById("modalClose");
        let lastFocused = null;

        function openModal(id) {
            const data = PROJECTS[id];
            if (!data) return;
            playOpenSound();
            lastFocused = document.activeElement;

            document.getElementById("modalTitle").textContent = data.title;
            document.getElementById("modalCategory").textContent = data.category;
            document.getElementById("modalDesc").textContent = data.desc;

            const img = document.getElementById("modalImage");
            const fallback = document.getElementById("modalFallback");
            fallback.querySelector("i").className = data.icon;
            img.style.display = "";
            img.src = data.image;
            img.alt = data.title + " preview";
            img.onerror = () => { img.style.display = "none"; };

            document.getElementById("modalFeatures").innerHTML =
                data.features.map((f) => `<li>${f}</li>`).join("");
            document.getElementById("modalTech").innerHTML =
                data.tech.map((t) => `<span>${t}</span>`).join("");
            document.getElementById("modalGithub").href = data.github;
            document.getElementById("modalDemo").href = data.demo;

            overlay.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            closeBtn.focus();
        }

        function closeModal() {
            if (!overlay.classList.contains("open")) return;
            playCloseSound();
            overlay.classList.remove("open");
            overlay.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            if (lastFocused) lastFocused.focus();
        }

        document.querySelectorAll(".project-card").forEach((card) => {
            card.addEventListener("click", (e) => {
                if (e.target.closest("a")) return; // let GitHub/Demo links work
                playClickSound();
                openModal(card.dataset.project);
            });
            // Keyboard support: Enter / Space opens the modal
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playClickSound();
                    openModal(card.dataset.project);
                }
            });
        });

        closeBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    })();

    /* ======================================================
       CONTACT FORM — validation + success toast (no backend)
       ====================================================== */
    (function initContactForm() {
        const form = document.getElementById("contactForm");
        const toast = document.getElementById("toast");
        let toastTimer = null;

        function setError(fieldId, errId, message) {
            const field = document.getElementById(fieldId);
            const err = document.getElementById(errId);
            field.closest(".form-field").classList.toggle("invalid", !!message);
            err.textContent = message || "";
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            playClickSound();

            const name = document.getElementById("cfName").value.trim();
            const email = document.getElementById("cfEmail").value.trim();
            const subject = document.getElementById("cfSubject").value.trim();
            const message = document.getElementById("cfMessage").value.trim();
            let valid = true;

            if (name.length < 2) { setError("cfName", "errName", "Please enter your name."); valid = false; }
            else setError("cfName", "errName", "");

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("cfEmail", "errEmail", "Please enter a valid email address."); valid = false; }
            else setError("cfEmail", "errEmail", "");

            if (subject.length < 3) { setError("cfSubject", "errSubject", "Please add a short subject."); valid = false; }
            else setError("cfSubject", "errSubject", "");

            if (message.length < 10) { setError("cfMessage", "errMessage", "Your message should be at least 10 characters."); valid = false; }
            else setError("cfMessage", "errMessage", "");

            if (!valid) return;

            // No backend configured — simulate a successful send.
            form.reset();
            toast.classList.add("show");
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => toast.classList.remove("show"), 4500);
        });
    })();

    /* ======================================================
       CUSTOM CURSOR — desktop only, dot + follower ring
       ====================================================== */
    (function initCursor() {
        if (isTouchDevice || prefersReducedMotion) return;
        const dot = document.getElementById("cursorDot");
        const follower = document.getElementById("cursorFollower");
        document.body.classList.add("custom-cursor-on");
        dot.style.display = follower.style.display = "block";

        let mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;
        document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

        (function animate() {
            ringX += (mouseX - ringX) * 0.16; // smooth trailing
            ringY += (mouseY - ringY) * 0.16;
            dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
            follower.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
            requestAnimationFrame(animate);
        })();

        const expandTargets = "a, button, .project-card, .skill-card, .service-card, input, textarea";
        document.addEventListener("mouseover", (e) => {
            follower.classList.toggle("is-active", !!e.target.closest(expandTargets));
        });
    })();

    /* Footer year */
    document.getElementById("year").textContent = new Date().getFullYear();
});
