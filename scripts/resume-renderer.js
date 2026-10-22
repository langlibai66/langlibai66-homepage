// Static resume markup. The editor continues to use src/resume.js as its data source.
const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const text = value => String(value == null ? '' : value).trim();
const present = value => Boolean(text(value) && !/^[-/—]+$/.test(text(value)));
const tag = (value, extra = '') => present(value) ? `<span class="cv-tag ${extra}">${esc(value)}</span>` : '';
const period = value => text(value).replace(/\s*(?:–|—|-)\s*/g, ' — ');
function webURL(value) {
    const raw = text(value);
    if (!raw) return '';
    try {
        const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
        return /^https?:$/.test(url.protocol) && url.hostname.includes('.') ? url.href : '';
    } catch { return ''; }
}
function contactsHTML(contacts) {
    const icons = { phone: 'fa-solid fa-phone', email: 'fa-regular fa-envelope', github: 'fa-brands fa-github', wechat: 'fa-brands fa-weixin', website: 'fa-solid fa-globe', linkedin: 'fa-brands fa-linkedin', twitter: 'fa-brands fa-twitter', bilibili: 'fa-brands fa-bilibili', blog: 'fa-solid fa-pen-nib' };
    return contacts.filter(c => present(c.value)).map(c => {
        const value = text(c.value);
        const type = c.type || 'other';
        const icon = `<i class="${icons[type] || 'fa-solid fa-link'}" aria-hidden="true"></i>`;
        const label = { github: 'GitHub', linkedin: 'LinkedIn', twitter: 'Twitter', bilibili: 'Bilibili', wechat: '微信 · ' + value }[type] || value.replace(/^mailto:/i, '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
        if (type === 'phone') return `<a class="cv-contact" href="tel:${esc(value)}" aria-label="拨打电话 ${esc(value)}">${icon}<span>${esc(label)}</span></a>`;
        if (type === 'email') {
            const email = value.replace(/^mailto:/i, '');
            return `<a class="cv-contact" href="mailto:${esc(email)}" data-copy="${esc(email)}" aria-label="复制邮箱 ${esc(email)}">${icon}<span>${esc(email)}</span></a>`;
        }
        if (type === 'wechat') return `<button class="cv-contact" type="button" data-copy="${esc(value)}" aria-label="复制微信 ${esc(value)}">${icon}<span>${esc(label)}</span></button>`;
        const url = webURL(value);
        return url ? `<a class="cv-contact" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon}<span>${esc(label)}</span><span class="external-mark" aria-hidden="true">↗</span></a>` : `<span class="cv-contact">${icon}<span>${esc(label)}</span></span>`;
    }).join('');
}
function item(title, meta, content, subtitle = '') {
    return `<article class="cv-entry"><div class="cv-entry-head"><div><h3>${title}</h3>${present(subtitle) ? `<p class="cv-entry-subtitle">${esc(subtitle)}</p>` : ''}</div>${present(meta) ? `<p class="cv-date">${esc(period(meta))}</p>` : ''}</div>${content}</article>`;
}
function renderResumePage(template, config) {
    const basics = config.basics || {};
    const data = key => Array.isArray(config[key]) ? config[key].filter(entry => entry && typeof entry === 'object') : [];
    const education = data('education').filter(e => present(e.school));
    const skills = data('skills').filter(s => present(s.category) || present(s.description));
    const publications = data('publications').filter(p => present(p.title));
    const openSource = data('openSource').filter(o => present(o.name));
    const projects = data('projects').filter(p => present(p.name));
    const awards = data('awards').filter(a => present(a.name));
    const sections = [
        { id: 'education', title: '教育经历', en: 'EDUCATION', entries: education,
            html: education.slice().reverse().map(e => item(esc(e.school), e.period,
                `<p class="cv-education-major">${esc([e.major, e.degree].filter(present).join(' · '))}</p>${present(e.gpa) ? `<p class="cv-gpa">${esc(e.gpa)}</p>` : ''}`)).join('') },
        { id: 'research', title: '科研经历', en: 'RESEARCH', entries: publications,
            html: publications.map(p => item(esc(p.title), p.period,
                `<div class="cv-tags">${tag(p.abbrev, 'is-accent')}${tag(p.role)}</div>${present(p.venue) ? `<p class="cv-venue">${esc(p.venue)}</p>` : ''}${Array.isArray(p.highlights) && p.highlights.filter(present).length ? `<ul class="cv-highlights">${p.highlights.filter(present).map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}`)).join('') },
        { id: 'opensource', title: '开源经历', en: 'OPEN SOURCE', entries: openSource,
            html: openSource.map(o => item(webURL(o.url) ? `<a class="cv-project-link" href="${esc(webURL(o.url))}" target="_blank" rel="noopener noreferrer">${esc(o.name)} <span aria-hidden="true">↗</span></a>` : esc(o.name), o.period,
                `<div class="cv-tags">${tag(o.role)}${tag(o.impact, 'is-accent')}</div>${present(o.description) ? `<p class="cv-description">${esc(o.description)}</p>` : ''}`, o.org)).join('') },
        { id: 'projects', title: '项目经历', en: 'PROJECTS', entries: projects,
            html: projects.map(p => item(esc(p.name), p.period,
                `<div class="cv-tags">${tag(p.role)}</div>${present(p.impact) ? `<p class="cv-impact">${esc(p.impact)}</p>` : ''}${present(p.description) ? `<p class="cv-description">${esc(p.description)}</p>` : ''}`, p.tag)).join('') },
        { id: 'skills', title: '专业技能', en: 'EXPERTISE', entries: skills,
            html: `<div class="cv-skills">${skills.map(s => `<article class="cv-skill"><h3>${esc(s.category)}</h3><p>${esc(s.description)}</p></article>`).join('')}</div>` },
        { id: 'awards', title: '竞赛荣誉', en: 'HONORS & AWARDS', entries: awards,
            html: `<div class="cv-awards">${awards.slice().sort((a, b) => text(b.date).localeCompare(text(a.date))).map(a => `<article class="cv-award"><p class="cv-date">${esc(a.date)}</p><div><h3>${esc(a.name)}</h3>${present(a.level) ? `<p class="cv-award-level">${esc(a.level)}</p>` : ''}</div></article>`).join('')}</div>` }
    ].filter(section => section.entries.length);
    const stats = [
        { id: 'research', label: '科研经历', count: publications.length },
        { id: 'opensource', label: '开源参与', count: openSource.length },
        { id: 'projects', label: '项目实践', count: projects.length },
        { id: 'awards', label: '竞赛荣誉', count: awards.length }
    ].filter(stat => stat.count);
    const values = {
        NAME: esc(basics.name), TITLE: esc(basics.title), SCHOOL: esc(basics.school),
        RESUME_PORTRAIT: present(basics.avatar) ? `<div class="cv-portrait-frame"><img class="cv-portrait" src="${esc(/^https?:\/\//i.test(text(basics.avatar)) ? text(basics.avatar) : '/' + text(basics.avatar).replace(/^\/+/, ''))}" alt="${esc(basics.name)}的证件照" width="128" height="168" decoding="async" /></div>` : '',
        CONTACTS_HTML: contactsHTML(data('contacts')),
        PERSONAL_TAG: present(basics.mbti) ? `<div class="cv-personal-tag"><span>个人标签</span><strong>${esc(basics.mbti)}</strong></div>` : '',
        SKILL_KEYWORDS: skills.map(s => s.category).filter(present).slice(0, 4).map(value => `<span>${esc(value)}</span>`).join(''),
        RESUME_STATS: stats.length ? `<div class="cv-stats">${stats.map(stat => `<a href="#${stat.id}" class="cv-stat"><strong>${String(stat.count).padStart(2, '0')}</strong><span>${stat.label}<span aria-hidden="true">↗</span></span></a>`).join('')}</div>` : '',
        RESUME_NAV: sections.map((section, index) => `<a class="cv-section-link" href="#${section.id}"><span class="cv-nav-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${section.title}<span class="cv-nav-dot" aria-hidden="true"></span></a>`).join(''),
        RESUME_SECTIONS: sections.map((section, index) => `<section class="cv-section" id="${section.id}" aria-labelledby="heading-${section.id}"><header class="cv-section-head"><span class="cv-section-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h2 id="heading-${section.id}">${section.title}</h2><span class="cv-section-en" aria-hidden="true">${section.en}</span></header>${section.html}</section>`).join('')
    };
    return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => Object.hasOwn(values, key) ? values[key] : match);
}
module.exports = { renderResumePage, webURL };
