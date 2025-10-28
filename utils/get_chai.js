
let chai_obj = null;

const get_chai = async () => {
  if (!chai_obj) {
    // Dynamically import ESM-only chai and chai-http
    const { expect, use } = await import("chai");
    const chaiHttp = await import("chai-http");

    // Register chai-http (can only call use() once)
    const chai = use(chaiHttp.default);

    // Save globally so we don’t re-import on every test
    chai_obj = { expect: expect, request: chai.request };
  }

  return chai_obj;
};

module.exports = get_chai;
