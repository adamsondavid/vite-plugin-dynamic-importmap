describe("index", () => {
  it("renders", () => {
    cy.visit("/");
    cy.get("script[type=importmap]").should("have.html", '{"imports":{"simple-cowsay":"/simple-cowsay.mjs"}}');
    cy.get("#app").should("contain.text", "dynamic importmap works!");
  });
});
