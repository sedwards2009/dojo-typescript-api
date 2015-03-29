declare module "doh/main" {
  /**
   * Add a test or group of tests.
   *
   * Adds the test or tests given by testsOrUrl to the group given by group (if any). For URL tests, unless
   * a group is explicitly provided the group given by the URL until the document arrives at which
   * point the group is renamed to the title of the document. For non-URL tests, if groupId is
   * not provided, then tests are added to the group "ungrouped"; otherwise if the given groupId does not
   * exist, it is created; otherwise, tests are added to the already-existing group.
   * groupIds may contain embedded AMD module identifiers as prefixes and/or test types as suffixes. Prefixes
   * and suffixes are denoted by a "!".
   *
   * @param groupId String?
   *             The name of the group, optionally with an AMD module identifier prefix and/or
   *             test type suffix. The value character set for group names and AMD module indentifiers
   *             is given by [A-Za-z0-9_/.-]. If provided, prefix and suffix are denoted by "!". If
   *             provided, type must be a valid test type.
   * @param testOrTests Array||Function||Object||String||falsy
   *             When a function, implies a function that defines a single test. DOH passes the
   *             DOH object to the function as the sole argument when the test is executed. When
   *             a string, implies the definition of a single test given by `new Function("t", testOrTests)`.
   *             When an object that contains the method `runTest` (which *must* be a function),
   *             implies a single test given by the value of the property `runTest`. In this case,
   *             the object may also contain the methods `setup` and `tearDown`, and, if provided, these
   *             will be invoked on either side of the test function. Otherwise when an object (that is,
   *             an object that does not contain the method `runTest`), then a hash from test name to
   *             test function (either a function or string as described above); any names that begin
   *             with "_" are ignored. When an array, the array must exclusively contain functions,
   *             strings, and/or objects as described above and each item is added to the group as
   *             per the items semantics.
   * @parma timeoutOrSetUp integer||Function?
   *             If tests is a URL, then must be an integer giving the number milliseconds to wait for the test
   *             page to load before signaling an error; otherwise, a function for initializing the test group.
   *             If a tearDown function is given, then a setup function must also be given.
   * @param tearDown Function?
   *             A function for deinitializing the test group.
   */
  function register(groupId: string, testOrTests: any[]|Function|Object|string, timeoutOrSetUp?: number|Function, tearDown?: Function): void;
  function register(testOrTests: any[]|Function|Object|string, timeoutOrSetUp?: number|Function, tearDown?: Function): void;
  
  class Deferred {
    constructor(canceller?: Function);
    getTestErrback(cb: Function, scope?: Object): Function;
    getTestCallback(cb: Function, scope?: Object): Function;
    _nextId(): number;
    cancel(): void;
    _pause(): void;
    _unpause(): void;
    _continue(res: Object): void;
    _resback(res: Object): void;
    _check(): void;
    resolve(res: Function): void;
    reject(res: Function): void;
    then(cb: Function, eb: Function): Deferred;
    always(cb: Function): void;
    otherwise(eb: Function): void;
    isFulfilled(): boolean;
    isResolved(): boolean;
    isRejected(): boolean;
    _fire(): void;
    getFunctionFromArgs(): Function;
    addCallbacks(cb: Function, eb: Function): Deferred;
    addCallback(cb: Function, cbfn: Function): Deferred;
    addErrback(cb: Function, cbfn: Function): Deferred;
    addBoth(cb: Function, cbfn: Function): Deferred;
    callback(value: any): void;
    errback(value: any): void;
  }
  
  function is(expected: any, actual: any, hint: string, doNotThrow?: any): any;
  function is(expected: any, actual: any, doNotThrow?: any): any;
  function isNot(notExpected: any, actual: any, hint?: string): any;

}
