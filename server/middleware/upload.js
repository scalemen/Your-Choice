import multer from 'multer';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directory exists
const uploadDir = join(dirname(__dirname), 'uploads');
const avatarDir = join(uploadDir, 'avatars');
const noteAttachmentsDir = join(uploadDir, 'notes');
const homeworkDir = join(uploadDir, 'homework');
const gameAssetsDir = join(uploadDir, 'games');

[uploadDir, avatarDir, noteAttachmentsDir, homeworkDir, gameAssetsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File type validation
const allowedMimeTypes = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/webm'
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov'
  ]
};

const allAllowedTypes = [
  ...allowedMimeTypes.images,
  ...allowedMimeTypes.documents,
  ...allowedMimeTypes.audio,
  ...allowedMimeTypes.video
];

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadDir;
    
    if (req.params.type === 'avatar' || req.body.type === 'avatar') {
      dest = avatarDir;
    } else if (req.params.type === 'note' || req.body.type === 'note') {
      dest = noteAttachmentsDir;
    } else if (req.params.type === 'homework' || req.body.type === 'homework') {
      dest = homeworkDir;
    } else if (req.params.type === 'game' || req.body.type === 'game') {
      dest = gameAssetsDir;
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const fileExtension = extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

// Single file upload middleware
export const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Mixed files upload middleware
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Main upload handler with image processing
export const uploadHandler = async (req, res, next) => {
  uploadSingle('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: 'Unexpected file field' });
        }
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return next();
    }

    try {
      // Process images (resize and optimize)
      if (allowedMimeTypes.images.includes(req.file.mimetype)) {
        await processImage(req.file);
      }

      // Add file metadata
      req.file.url = `/uploads/${req.file.filename}`;
      req.file.type = getFileCategory(req.file.mimetype);
      
      next();
    } catch (error) {
      console.error('File processing error:', error);
      // Clean up uploaded file if processing fails
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'File processing failed' });
    }
  });
};

// Image processing function
async function processImage(file) {
  const { path, mimetype } = file;
  
  // Skip SVG files
  if (mimetype === 'image/svg+xml') {
    return;
  }

  try {
    // Read original image
    const image = sharp(path);
    const metadata = await image.metadata();

    // Optimize and resize if necessary
    let processedImage = image;

    // Resize large images
    if (metadata.width > 2048 || metadata.height > 2048) {
      processedImage = processedImage.resize(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Apply compression based on file type
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      processedImage = processedImage.jpeg({ quality: 85, progressive: true });
    } else if (mimetype === 'image/png') {
      processedImage = processedImage.png({ quality: 85, progressive: true });
    } else if (mimetype === 'image/webp') {
      processedImage = processedImage.webp({ quality: 85 });
    }

    // Save processed image
    await processedImage.toFile(path + '.tmp');
    
    // Replace original with processed image
    fs.renameSync(path + '.tmp', path);

    console.log(`Image processed: ${file.filename}`);
  } catch (error) {
    console.error('Image processing error:', error);
    // Continue without processing if error occurs
  }
}

// Get file category based on MIME type
function getFileCategory(mimetype) {
  if (allowedMimeTypes.images.includes(mimetype)) return 'image';
  if (allowedMimeTypes.documents.includes(mimetype)) return 'document';
  if (allowedMimeTypes.audio.includes(mimetype)) return 'audio';
  if (allowedMimeTypes.video.includes(mimetype)) return 'video';
  return 'other';
}

// Homework image upload with OCR preparation
export const uploadHomeworkImage = async (req, res, next) => {
  uploadSingle('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file || !allowedMimeTypes.images.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Please upload a valid image file' });
    }

    try {
      // Process image for better OCR results
      await preprocessImageForOCR(req.file);
      req.file.url = `/uploads/${req.file.filename}`;
      next();
    } catch (error) {
      console.error('Homework image processing error:', error);
      res.status(500).json({ error: 'Image processing failed' });
    }
  });
};

// Preprocess image for better OCR results
async function preprocessImageForOCR(file) {
  const { path } = file;
  
  try {
    const image = sharp(path);
    const metadata = await image.metadata();

    // Enhance image for OCR
    let processedImage = image
      .resize(Math.min(metadata.width * 2, 3000), Math.min(metadata.height * 2, 3000), {
        fit: 'inside',
        withoutEnlargement: false,
        kernel: sharp.kernel.lanczos3
      })
      .sharpen()
      .normalize()
      .jpeg({ quality: 95 });

    // Save enhanced image
    await processedImage.toFile(path + '.enhanced');
    fs.renameSync(path + '.enhanced', path);

    console.log(`OCR image preprocessed: ${file.filename}`);
  } catch (error) {
    console.error('OCR preprocessing error:', error);
  }
}

// Clean up old files (run periodically)
export function cleanupOldFiles(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  [uploadDir, avatarDir, noteAttachmentsDir, homeworkDir, gameAssetsDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;

    fs.readdir(dir, (err, files) => {
      if (err) {
        console.error(`Error reading directory ${dir}:`, err);
        return;
      }

      files.forEach(file => {
        const filePath = join(dir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          if (stats.mtime < cutoffDate) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting file ${filePath}:`, err);
              } else {
                console.log(`Deleted old file: ${filePath}`);
              }
            });
          }
        });
      });
    });
  });
}

// Avatar upload middleware
export const uploadAvatar = async (req, res, next) => {
  uploadSingle('avatar')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return next();
    }

    if (!allowedMimeTypes.images.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Please upload a valid image file for avatar' });
    }

    try {
      // Process avatar (resize to square and optimize)
      await processAvatar(req.file);
      req.file.url = `/uploads/avatars/${req.file.filename}`;
      next();
    } catch (error) {
      console.error('Avatar processing error:', error);
      res.status(500).json({ error: 'Avatar processing failed' });
    }
  });
};

// Process avatar image
async function processAvatar(file) {
  const { path } = file;
  
  try {
    await sharp(path)
      .resize(256, 256, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(path + '.processed');
    
    fs.renameSync(path + '.processed', path);
    console.log(`Avatar processed: ${file.filename}`);
  } catch (error) {
    console.error('Avatar processing error:', error);
  }
}