// «Сейф ♥»: сохранённые вакансии
class SafePage {
  constructor(page) {
    this.page = page;
    this.tab = page.locator('[data-tab="saved"]');
    this.screen = page.locator('#screen');
    this.heading = this.screen.getByRole('heading', { name: /СЕЙФ/ });
    this.jobs = this.screen.getByRole('group');
  }

  job(title) { return this.jobs.filter({ hasText: title }).first(); }

  removeButton(title) { return this.job(title).getByRole('button', { name: 'Убрать из сейфа' }); }
}
module.exports = { SafePage };
