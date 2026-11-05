context('SEO and engagement regression checks', () => {
  beforeEach(() => { cy.clearLocalStorage(); });

  it('serves both canonical pages directly with useful HTML before JavaScript', () => {
    for (const [route, expectedTitle] of [
      ['/', 'Convert Musical Notes to Guitar Tabs | Notes to Tab'],
      ['/sheet-music-to-guitar-tabs/', 'How to Convert Sheet Music to Guitar Tabs | Notes to Tab'],
    ]) {
      cy.request(route).then(response => {
        expect(response.status).to.eq(200);
        const document = new DOMParser().parseFromString(response.body, 'text/html');
        expect(document.title).to.eq(expectedTitle);
        expect(document.querySelectorAll('h1')).to.have.length(1);
        expect(document.querySelectorAll('link[rel="canonical"]')).to.have.length(1);
        expect(document.querySelector('link[rel="canonical"]').href).to.eq(`https://www.notestotab.com${route}`);
        expect(document.querySelector('main').textContent.length).to.be.greaterThan(300);
      });
      cy.visit(route);
      cy.reload();
      cy.title().should('eq', expectedTitle);
      cy.get('h1').should('have.length', 1);
    }
    cy.request('/sitemap.xml').its('status').should('eq', 200);
    cy.request('/robots.txt').its('body').should('include', 'https://www.notestotab.com/sitemap.xml');
  });

  it('has crawlable links between the homepage and guide', () => {
    cy.visit('/');
    cy.get('a[href="/sheet-music-to-guitar-tabs/"]').click();
    cy.get('h1').should('have.text', 'How to Convert Sheet Music to Guitar Tabs');
    cy.get('nav a[href="/"]').click();
    cy.get('#userKeyInput').should('be.visible');
  });

  it('preserves one H1 and tracks only real, non-duplicate converter engagement', () => {
    cy.visit('/');
    cy.get('#continueToBarViewBtn').click();
    cy.get('h1').should('have.length', 1);
    cy.get('#build-table-btn').click();
    cy.get('[role="alert"]').should('contain', 'at least one');
    cy.get('canvas').click(40, 150);
    cy.get('#build-table-btn').click();
    cy.get('#build-table-btn').click();
    cy.get('#tab-table span').first().should('contain', '0');
    cy.window().then(win => {
      const events = win.dataLayer.map(args => Array.from(args));
      expect(events.filter(event => event[0] === 'config')).to.have.length(1);
      expect(events.filter(event => event[1] === 'converter_started')).to.deep.eq([['event', 'converter_started']]);
      expect(events.filter(event => event[1] === 'conversion_completed')).to.deep.eq([['event', 'conversion_completed']]);
    });
  });

  it('keeps pages within a narrow viewport while allowing the full-size stave to scroll', () => {
    cy.viewport(320, 740);
    for (const route of ['/sheet-music-to-guitar-tabs/', '/']) {
      cy.visit(route);
      cy.document().then(doc => { expect(doc.documentElement.scrollWidth).to.be.at.most(320); });
    }
    cy.get('#continueToBarViewBtn').click();
    cy.document().then(doc => { expect(doc.documentElement.scrollWidth).to.be.at.most(320); });
    cy.get('.canvas-container').then(container => {
      expect(container[0].scrollWidth).to.be.greaterThan(container[0].clientWidth);
    });
  });
});
