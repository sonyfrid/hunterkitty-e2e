// Лента вакансий
class FeedPage {
  constructor(page) {
    this.page = page;
    this.tab = page.locator('[data-tab="feed"]');
    this.search = page.locator('#in-q');
    this.count = page.locator('#v3count');
    this.jobs = page.locator('article.v3job');
    this.visibleJobs = page.locator('article.v3job:visible');
    this.log = page.locator('#log');
  }

  quickFilter(code) { return this.page.locator(`.chips.quick [data-qf="${code}"]`); }

  job(title) { return this.jobs.filter({ has: this.page.locator('.t', { hasText: title }) }).first(); }

  titles() { return this.visibleJobs.locator('.t').allInnerTexts(); }

  async open(title) { await this.job(title).locator('button.open').click(); }

  async save(title) { await this.job(title).locator('button.heart').click(); }

  saveButton(title) { return this.job(title).locator('button.heart'); }

  applyButton(title) { return this.job(title).locator('button[data-apply]'); }

  async waitLoaded() { await this.count.waitFor(); }
}
module.exports = { FeedPage };
