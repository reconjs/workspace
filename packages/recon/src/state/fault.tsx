let _fault: Error|null = null

class Faulty {
  try () {
    if (_fault) throw _fault
  }
  throw (error?: any) {
    if (! (error instanceof Error)) {
      error = new Error ("FAULT")
    }
  
    _fault ??= error
    throw _fault
  }
  catch (error: any) {
    if (_fault) throw error
    console.error (error)
  }
}

export const faulty = new Faulty()
