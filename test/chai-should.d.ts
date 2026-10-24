export {};

declare global {
  interface Object {
    should: Chai.Assertion;
  }
  interface String {
    should: Chai.Assertion;
  }
  interface Number {
    should: Chai.Assertion;
  }
  interface Boolean {
    should: Chai.Assertion;
  }
  interface Function {
    should: Chai.Assertion;
  }
}
