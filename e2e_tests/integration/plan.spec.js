/*
 * Copyright (c) 2002-2018 "Neo4j, Inc"
 * Network Engine for Objects in Lund AB [http://neotechnology.com]
 *
 * This file is part of Neo4j.
 *
 * Neo4j is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Cypress, cy, test, expect */

describe('Plan output', () => {
  it('can connect', () => {
    cy.executeCommand(':server disconnect')
    cy.executeCommand(':clear')
    cy.executeCommand(':server connect')
    const password = Cypress.env('BROWSER_NEW_PASSWORD') || 'newpassword'
    cy.connect(password)
  })
  it('ouputs and preselects plan when using PROFILE', () => {
    cy.executeCommand(':clear')
    cy.executeCommand(`PROFILE MATCH (tag:Tag)
    WHERE tag.name IN ["Eutheria"]
    WITH tag
    MATCH (publication)-[:HAS_TAG]->(tag)
    WHERE SIZE((publication)-[:HAS_TAG]->()) = 1
    WITH publication, tag
    MATCH (expert)-[:PUBLISHED]->(publication)
    WITH expert, collect(DISTINCT publication) AS publications, count(DISTINCT publication) AS relevantNumberOfPublications
    RETURN expert.name, publications, relevantNumberOfPublications, 1 AS relevantNumberOfTags
    ORDER BY relevantNumberOfPublications DESC
    LIMIT 50;`)
    cy.get('[data-test-id="planExpandButton"]', { timeout: 10000 }).click()
    const el = cy.get('[data-test-id="planSvg"]', { timeout: 10000 })
    el
      .should('contain', 'NodeByLabelScan')
      .and('contain', 'tag')
      .and('contain', ':Tag')
      .and('contain', 'Filter')
      .and('contain', 'Expand(All)')
      .and('contain', 'publication, tag')
      .and('contain', '(tag)<-[') // Line breaks into next
      .and('contain', '-(publication)')
      .and('contain', ':PUBLISHED]-(expert)')
      .and('contain', 'EagerAggregation')
      .and('contain', 'Projection')
      .and('contain', 'ProduceResults')
      .and('contain', 'relevantNumberOfPublications')
      .and('contain', 'relevantNumberOfTags')
      .and('contain', 'Result')
    if (Cypress.config.serverVersion >= 3.3) {
      el.should('contain', 'tag.name IN').and('contain', 'GetDegreePrimitive')
    } else if (Cypress.config.serverVersion === 3.2) {
      el.should('contain', 'ConstantCachedIn').and('contain', 'GetDegree')
    }

    cy.executeCommand(':clear')
    cy.executeCommand(
      `profile match (n:Person) with n where size ( (n)-[:Follows]->()) > 6 return n;`
    )
    cy.get('[data-test-id="planExpandButton"]', { timeout: 10000 }).click()
    const el2 = cy.get('[data-test-id="planSvg"]', { timeout: 10000 })
    el2.should('contain', 'NodeByLabelScan')
    if (Cypress.config.serverVersion >= 3.3) {
      el2.should('contain', 'GetDegreePrimitive')
    } else if (Cypress.config.serverVersion === 3.2) {
      el2.should('contain', 'GetDegree')
    }
  })
})
