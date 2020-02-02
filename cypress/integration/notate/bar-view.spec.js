context('Bar view', () => {

  const prepInGivenKey = key => {
    cy.clearLocalStorage();
    cy.visit('http://localhost:3000');
    cy.get('#userKeyInput').type('{backspace}').type(key);
    cy.get('#continueToBarViewBtn').click();
  };

  describe('startup', () => {
    const startupKey = 'C';
    beforeEach(() => {
      prepInGivenKey(startupKey)
    });

    it('should have the quarter note set as default denom', () => {
        cy.get('#denom-buttons button:nth-of-type(3)').should('have.css', 'border', '1px solid rgb(255, 0, 0)');
    });

    it('on refreshing it should remember the key', () => {
      cy.reload();
      cy.get('#active-key').should('have.text', startupKey);
      expect(localStorage.getItem('userData')).to.eq(`{"appStep":1,"userKey":"${startupKey}"}`)
    });
  });

  describe('D major', () => {
    beforeEach(() => {
      prepInGivenKey('D')
    });
    it('should transpose notes grouped as a chord', () => {

      cy.get('canvas').click(50, 275);
      cy.get('canvas').click(50, 274);
      cy.get('canvas').click(50, 230);
      cy.get('canvas').click(50, 231);
      cy.get('canvas').click(50, 200);
      cy.get('canvas').click(50, 190);
      cy.get('canvas').click(50, 160);
      cy.get('canvas').click(50, 150);

      cy.get('#build-table-btn').click();


      cy.get('#tab-table').should('have.html', '<span>---0------------------------------------------------------------</span><span>---2------------------------------------------------------------</span><span>---2------------------------------------------------------------</span><span>---4------------------------------------------------------------</span><span>----------------------------------------------------------------</span><span>----------------------------------------------------------------</span><br>');

    });
  });
});
