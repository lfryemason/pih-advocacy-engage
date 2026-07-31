import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchMeetingBuildings,
  invalidateMeetingBuildingsCache,
} from "@/lib/meetings/queries";

const mockRpc = vi.fn();

function mockClient() {
  return { rpc: mockRpc } as unknown as Parameters<
    typeof fetchMeetingBuildings
  >[0];
}

describe("fetchMeetingBuildings", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    invalidateMeetingBuildingsCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the fetch_meeting_buildings RPC and returns building names", async () => {
    mockRpc.mockResolvedValue({
      data: [{ building: "Cannon" }, { building: "Hart" }],
      error: null,
    });

    expect(await fetchMeetingBuildings(mockClient())).toEqual([
      "Cannon",
      "Hart",
    ]);
    expect(mockRpc).toHaveBeenCalledWith("fetch_meeting_buildings", {
      p_org_id: expect.any(String),
    });
  });

  it("serves a second call from cache instead of hitting the RPC again", async () => {
    mockRpc.mockResolvedValue({ data: [{ building: "Hart" }], error: null });

    await fetchMeetingBuildings(mockClient());
    await fetchMeetingBuildings(mockClient());

    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it("refetches after the cache is explicitly invalidated", async () => {
    mockRpc.mockResolvedValue({ data: [{ building: "Hart" }], error: null });

    await fetchMeetingBuildings(mockClient());
    invalidateMeetingBuildingsCache();
    await fetchMeetingBuildings(mockClient());

    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it("refetches after a failed call rather than caching the error", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    mockRpc.mockResolvedValueOnce({
      data: [{ building: "Hart" }],
      error: null,
    });

    await expect(fetchMeetingBuildings(mockClient())).rejects.toThrow();
    expect(await fetchMeetingBuildings(mockClient())).toEqual(["Hart"]);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });
});
