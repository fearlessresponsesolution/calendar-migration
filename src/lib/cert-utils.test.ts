import { certBadgeStyle } from "./cert-utils"

describe("certBadgeStyle", () => {
  it("returns green palette for Basic", () => {
    const style = certBadgeStyle("Basic")
    expect(style.color).toBe("#4ade80")
    expect(style.background).toBe("#1e3a2a")
  })

  it("returns blue palette for Senior", () => {
    const style = certBadgeStyle("Senior")
    expect(style.color).toBe("#60a5fa")
  })

  it("returns purple palette for Master", () => {
    const style = certBadgeStyle("Master")
    expect(style.color).toBe("#c084fc")
  })

  it("always includes fontSize, fontWeight, padding, borderRadius", () => {
    const style = certBadgeStyle("Basic")
    expect(style.fontSize).toBe(10)
    expect(style.fontWeight).toBe(700)
    expect(style.padding).toBe("1px 6px")
    expect(style.borderRadius).toBe(3)
  })
})
