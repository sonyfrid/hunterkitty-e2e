// Первый вход: «Кем хочешь работать?»
class OnboardingPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Кем хочешь работать?' });
    this.title = page.locator('#in-title');
    this.findButton = page.locator('[data-act="onb-find"]');
  }

  format(code) { return this.page.locator(`.onb-fmt [data-fmt="${code}"]`); }

  async chooseTitle(title) {
    await this.title.fill(title);
    await this.title.press('Enter');
  }
}
module.exports = { OnboardingPage };
