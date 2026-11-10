// Вкладка «Фильтры» у настроенного профиля
class FiltersPage {
  constructor(page) {
    this.page = page;
    this.tab = page.locator('[data-tab="work"]');
    this.showVacancies = page.getByRole('button', { name: /^ПОКАЗАТЬ.*ВАКАНСИ/ });
    this.screen = page.locator('#screen');
  }

  section(name) { return this.screen.locator('section, .block, .card').filter({ hasText: name }).first(); }
}
module.exports = { FiltersPage };
