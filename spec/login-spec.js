let request = require('request');
let url_base = "http://localhost:5000/"

describe("Login page", function() {
  describe("GET /login", function() {
    it("returns status code 200", function(done) {
      // test status code from login page
      request.get(url_base, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });
});

describe("Register page", function() {
  describe("GET /register", function() {
    it("returns status code 200", function(done) {
      // register page
      request.get(url_base, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });
});

// now one post method
describe("Feedback page", function() {
  describe("POST /feedback", function() {
    it("returns status code 200", function(done) {
      request.get(url_base, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });
});

describe("Feedback page", function() {
  describe("GET /feedback", function() {
    it("returns status code 200", function(done) {
      request.get(url_base, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });
});

describe("Signup page", function() {
  describe("GET /signup", function() {
    it("returns status code 200", function(done) {
      request.get(url_base, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });
});
