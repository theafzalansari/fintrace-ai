import multer from 'multer';

// Use memory storage for processing uploaded CSV files directly in memory
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
});
