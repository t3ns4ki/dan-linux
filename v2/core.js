(function (root) {
  'use strict';
  const app = root.DanV2 = root.DanV2 || {};
  app.version = '2.0.0';
  app.escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  app.store = {
    read(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } },
    write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
    remove(key) { try { localStorage.removeItem(key); } catch {} }
  };
  app.level = xp => 1 + Math.floor(Math.max(0, Number(xp) || 0) / 150);
  app.notify = message => root.DanLegacy?.toast(message);
  app.emit = (name, detail) => { if (typeof root.dispatchEvent === 'function') root.dispatchEvent(new CustomEvent(name, {detail})); };
  app.achievements = [
    {id:'hello-linux', name:'Hello, Linux!', description:'первый пройденный урок', bonus:20},
    {id:'terminal-enjoyer', name:'Terminal Enjoyer', description:'весь курс терминала', bonus:30},
    {id:'package-master', name:'Package Manager Master', description:'все пакетные менеджеры', bonus:30},
    {id:'open-source', name:'Open Source Enthusiast', description:'весь курс основ Linux', bonus:30},
    {id:'arch-btw', name:'I use Arch btw.', description:'разобраться с pacman', bonus:20},
    {id:'kernel-master', name:'Kernel Master', description:'весь продвинутый курс', bonus:40},
    {id:'chocolate', name:'Chocolate Trapezoid', description:'найти шоколадный секрет терминала', bonus:20, secret:true}
  ];
  app.earned = (completed, secrets = []) => {
    const ids = new Set(completed);
    const result = [];
    if (ids.size) result.push('hello-linux');
    for (const [course, badge] of [['terminal','terminal-enjoyer'],['packages','package-master'],['basics','open-source'],['advanced','kernel-master']]) {
      const lessons = (app.lessons || []).filter(lesson => lesson.course === course);
      if (lessons.length && lessons.every(lesson => ids.has(lesson.id))) result.push(badge);
    }
    if (ids.has('pkg-pacman')) result.push('arch-btw');
    if (secrets.includes('chocolate')) result.push('chocolate');
    return result;
  };
  app.progressSummary = state => {
    const completed = Object.keys(state?.completed || {}).filter(id => app.lessons.some(lesson => lesson.id === id));
    const badges = app.earned(completed, state?.secrets || []);
    const xp = completed.reduce((sum, id) => sum + app.lessons.find(lesson => lesson.id === id).xp, 0)
      + badges.reduce((sum, id) => sum + app.achievements.find(badge => badge.id === id).bonus, 0);
    return {completed, badges, xp, level:app.level(xp)};
  };
})(globalThis);
