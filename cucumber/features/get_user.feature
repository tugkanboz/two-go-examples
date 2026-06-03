Feature: Get user
  As an API client
  I want to fetch a user by id
  So that I can show their details

  Scenario: Get an existing user
    Given a user named "Grace" exists
    When I get that user by id
    Then the response status should be 200
    And the response field "name" should be "Grace"

  Scenario: Get a user that does not exist
    When I get the user with id "999999"
    Then the response status should be 404
    And the response field "error" should be "user not found"

  Scenario: Reject a non numeric id
    When I get the user with id "abc"
    Then the response status should be 400
    And the response field "error" should be "id must be a number"
