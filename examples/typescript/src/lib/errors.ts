class ErrorReporter {
  private apiKey: string

  constructor(apiKey: string) {
    if (apiKey === undefined || apiKey === "") {
      throw new Error("apiKey required")
    }

    this.apiKey = apiKey
  }

  report(err: Error) {
    // could use apiKey here to send error somewhere
  }
}

export default new ErrorReporter(process.env.ERR_API_KEY)
