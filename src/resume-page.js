document.addEventListener('DOMContentLoaded', function () {
    const print = document.getElementById('resume-print');
    if (print && typeof window.print === 'function') {
        print.hidden = false;
        print.addEventListener('click', () => window.print());
    }
    const toast = document.getElementById('resume-toast');
    let toastTimer;
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
    }
    function fallbackCopy(value) {
        const previousFocus = document.activeElement;
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild(field);
        field.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch { /* Show the value on failure. */ }
        field.remove();
        if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
        return copied;
    }
    document.querySelectorAll('[data-copy]').forEach(function (button) {
        button.addEventListener('click', async function (event) {
            // Preserve mailto for new-tab, modified clicks and no-JavaScript use.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            const value = button.dataset.copy;
            let copied = false;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(value);
                    copied = true;
                }
            } catch { /* Fall back for non-secure contexts or denied permission. */ }
            if (!copied) copied = fallbackCopy(value);
            showToast(copied ? '已复制：' + value : '复制未成功，请手动复制：' + value);
        });
    });
    const portrait = document.querySelector('.cv-portrait');
    if (portrait) {
        const hideUnavailable = () => portrait.closest('.cv-portrait-frame').classList.add('is-unavailable');
        portrait.addEventListener('error', hideUnavailable);
        if (portrait.complete && !portrait.naturalWidth) hideUnavailable();
    }
    const sections = Array.from(document.querySelectorAll('.cv-section'));
    const links = Array.from(document.querySelectorAll('.cv-section-link'));
    let scheduled = false;
    function updateActiveSection() {
        scheduled = false;
        if (!sections.length) return;
        let active = sections[0].id;
        sections.forEach(section => {
            if (section.getBoundingClientRect().top <= 150) active = section.id;
        });
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) active = sections[sections.length - 1].id;
        links.forEach(link => {
            if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }
    function scheduleUpdate() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(updateActiveSection);
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate);
    updateActiveSection();
});
