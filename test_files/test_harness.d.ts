declare var assert: {
  equal(a:any, b:any): any;
  instanceOf(a:any, b:any): any;
  isNull(a:any): any;
  ok(a: boolean): any;
  isTrue(a: boolean): any;
  isFalse(a: boolean): any;
};

declare function registerSuite(x: any): void;
