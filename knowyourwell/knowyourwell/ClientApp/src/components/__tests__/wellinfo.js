/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import axios from "axios";
import WellInfo, { generateWellcode } from "../wellinfo";


jest.mock('axios');
describe("the function that generates the well code", () => {
  it('returns the proper well code', async () => {
    axios.get.mockResolvedValue({
    data:
        {
            wellcode: "UNL001",
        },
    });

    const testCode = await generateWellcode();
    expect(testCode).toEqual("UNL001");
  });
});