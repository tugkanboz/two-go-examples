Feature: Create user
  As an API client
  I want to create users
  So that they can use the system

  @smoke
  Scenario: Create a user with valid data
    When I create a user named "Ada" with email "ada@example.com"
    Then the response status should be 201
    And the response field "name" should be "Ada"

  Scenario: Reject a missing name
    When I create a user with no name and email "no-name@example.com"
    Then the response status should be 400
    And the response field "error" should be "name is required"

  Scenario: Reject an invalid email
    When I create a user named "Bob" with email "not-an-email"
    Then the response status should be 400
    And the response field "error" should be "email is invalid"
