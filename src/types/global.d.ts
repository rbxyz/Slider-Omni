declare global {
  var presentations: Map<
    string,
    {
      id: string
      title: string
      description?: string
      slides: Array<{
        id: string
        title: string
        htmlContent: string
        order: number
      }>
      createdAt: Date
    }
  >
}

export {}
  