import { Request, Response, NextFunction } from "express";
import httpMocks from "node-mocks-http";
import { getMembersProfile } from "../../../src/modules/member/member.controller";
import * as memberService from "../../../src/modules/member/member.service";
import "../../../src/config/logging"; // initializes globalThis.logging

jest.mock("../../../src/modules/member/member.service");

const mockedFetch = memberService.fetchMemberByMemberNo as jest.MockedFunction<
  typeof memberService.fetchMemberByMemberNo
>;

const mockMember = {
  member_no: "M001",
  member_name: "Juan Dela Cruz",
  email: "juan@example.com",
  member_type: "REGULAR",
  bdate: "1990-01-01",
  addr_street1: "123 Main St",
  tel_no: "09171234567",
  gender: "M",
  membership_date: "2010-06-15",
  religion: "Catholic",
  mbr_tin_no: "123-456-789",
  op_id: "OP01",
  mbr_status: "A",
  chapter: "MAIN",
  sms_cpno: "09171234567",
  credit_limit: 50000,
  credit_availed: 10000,
};

describe("getMembersProfile", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    const req = httpMocks.createRequest({ method: "GET", url: "/member" });
    const res = httpMocks.createResponse();

    await getMembersProfile(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ success: false, message: "Unauthorized" });
  });

  it("returns 404 when member is not found in the database", async () => {
    mockedFetch.mockResolvedValueOnce(null);

    const req = httpMocks.createRequest({ method: "GET", url: "/member" });
    req.user = { memberNo: "M999" };
    const res = httpMocks.createResponse();

    await getMembersProfile(req, res, next);

    expect(mockedFetch).toHaveBeenCalledWith("M999");
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toEqual({ success: false, message: "Member not found" });
  });

  it("returns 200 with member data when member exists", async () => {
    mockedFetch.mockResolvedValueOnce(mockMember);

    const req = httpMocks.createRequest({ method: "GET", url: "/member" });
    req.user = { memberNo: "M001" };
    const res = httpMocks.createResponse();

    await getMembersProfile(req, res, next);

    expect(mockedFetch).toHaveBeenCalledWith("M001");
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ success: true, member: mockMember });
  });
});
