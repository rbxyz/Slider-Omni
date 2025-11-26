export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Retrieve from global memory
    if (typeof globalThis !== "undefined" && globalThis.presentations) {
      const presentation = globalThis.presentations.get(id)

      if (presentation) {
        return Response.json(presentation)
      }
    }

    return Response.json({ error: "Presentation not found" }, { status: 404 })
  } catch (error) {
    console.error("[v0] Error fetching presentation:", error)
    return Response.json({ error: "Failed to fetch presentation" }, { status: 500 })
  }
}
  