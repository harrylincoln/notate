context('App startup', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000')
    });

    it('should have a default active key of C', () => {
        cy.get('#active-key').should('have.text', 'C')
    });

    it('should have C as the default input value', () => {
        cy.get('#userKeyInput').should('have.value', 'C');
    });

    it('should change the active key when updating the input field', () => {
        const newKey = 'D#';
        cy.get('#userKeyInput').type('{backspace}').type(newKey);
        cy.get('#active-key').should('have.text', newKey)
    });
});
