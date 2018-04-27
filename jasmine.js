const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const noop = function() {};

const jasmine = new Jasmine();
jasmine.configureDefaultReporter({ // remove default reporter logs
  print: noop
});
jasmine.addReporter(new SpecReporter({  // add jasmine-spec-reporter
  spec: {
    displayPending: true,
  },
  summary: {
    displayDuration: false,
  }
}));
jasmine.loadConfigFile('./spec/jasmine.json'); // load jasmine.json configuration
jasmine.execute();
