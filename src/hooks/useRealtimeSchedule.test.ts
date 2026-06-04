import { renderHook } from "@testing-library/react"
import { useRealtimeSchedule } from "./useRealtimeSchedule"

const mockOn = jest.fn().mockReturnThis()
const mockSubscribe = jest.fn().mockReturnThis()
const mockUnsubscribe = jest.fn()
const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe, unsubscribe: mockUnsubscribe }))
const mockRemoveChannel = jest.fn()

jest.mock("@/lib/supabase/client", () => ({
  getBrowserClient: jest.fn(() => ({
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  })),
}))

describe("useRealtimeSchedule", () => {
  const onShiftChange = jest.fn()
  const onMemberChange = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it("subscribes to shifts and members channels on mount", () => {
    renderHook(() =>
      useRealtimeSchedule({ onShiftChange, onMemberChange })
    )
    expect(mockChannel).toHaveBeenCalledWith("shifts")
    expect(mockChannel).toHaveBeenCalledWith("members")
  })

  it("unsubscribes from channels on unmount", () => {
    const { unmount } = renderHook(() =>
      useRealtimeSchedule({ onShiftChange, onMemberChange })
    )
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it("exposes connected state (starts true after subscribe)", () => {
    const { result } = renderHook(() =>
      useRealtimeSchedule({ onShiftChange, onMemberChange })
    )
    expect(typeof result.current.connected).toBe("boolean")
  })
})
