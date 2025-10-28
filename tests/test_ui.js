
const { app } = require("../app");
const get_chai = require("../utils/get_chai");

describe("test getting a page", function () {
  it("should get the home page", async () => {
    const { expect, request } = await get_chai();
    const req = request.execute(app).get("/").send();
    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    // Check for something actually visible in home page
    expect(res.text).to.include("Expense Tracker");
  });
});
