import multer from "multer"

// store files in memory
const storage = multer.memoryStorage()

export const upload = multer({ storage })
