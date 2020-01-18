context('Bar view', () => {

  const activeKey = 'D';

    beforeEach(() => {
      cy.visit('http://localhost:3000');
      cy.get('#userKeyInput').type('{backspace}').type(activeKey);
      cy.get('#continueToBarViewBtn').click();
    });

    it('should start at bar one', () => {
        cy.get('#active-bar').should('have.text', '1');
    });

    it('should have the quarter note set as default denom', () => {
        cy.get('#denom-buttons button:nth-of-type(3)').should('have.css', 'border', '1px solid rgb(255, 0, 0)');
    });

    it('on refreshing it should remember the bar, key and where you are', () => {
      cy.reload();
      cy.get('#active-bar').should('have.text', '1');
      cy.get('#active-key').should('have.text', activeKey);
      expect(localStorage.getItem('userData')).to.eq('{"appStep":1,"userKey":"D#","activeBarNumber":1}')
    });

    it.only('should be able to plot a note and save to state', () => {
      cy.get('canvas').click(50, 275);
      cy.get('canvas').click(50, 230);
      cy.get('canvas').click(50, 200);
      cy.get('canvas').click(50, 160);

      cy.get('#build-table-btn').click();


      expect(cy.get('#tab-table')).to.have.html('<section id="tab-table" class="App-content code"><span>---0------------------------------------------------------------</span><span>---2------------------------------------------------------------</span><span>---2------------------------------------------------------------</span><span>---4------------------------------------------------------------</span><span>----------------------------------------------------------------</span><span>----------------------------------------------------------------</span><br></section>');

    });
});