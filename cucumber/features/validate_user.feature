@validation
Feature: Create user validation
  The same create endpoint, checked across many inputs with one Scenario Outline.

  Scenario Outline: validating create input
    When I create a user named "<name>" with email "<email>"
    Then the response status should be <status>

    Examples:
      | name | email                  | status |
      | Ada  | outline-1@example.com  | 201    |
      | Bob  | outline-2@example.com  | 201    |
      |      | outline-3@example.com  | 400    |
      | Cleo | not-an-email           | 400    |
