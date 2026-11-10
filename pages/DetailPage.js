// Карточка вакансии
class DetailPage {
  constructor(page) {
    this.page = page;
    this.root = page.locator('.detail');
    this.title = this.root.locator('.dtitle');
    this.money = this.root.locator('.money');
    this.description = this.root.locator('.desc');
    this.apply = this.root.locator('button[data-apply]');
    this.save = this.root.locator('button.heart');
  }

  field(name) { return this.root.locator('dt', { hasText: name }).locator('xpath=following-sibling::dd[1]'); }
}
module.exports = { DetailPage };
