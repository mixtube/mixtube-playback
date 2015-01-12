exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['dist/test/integration/*Spec.bundle.js'],
  framework: 'jasmine2',
  baseUrl: 'http://localhost:3000'
};