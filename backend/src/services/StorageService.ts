/* global Express, NodeJS */
import fs from 'fs';
import path from 'path';
import env from '../config/env.js';
import logger from '../config/logger.js';

export interface StorageProvider {
  /**
   * Saves a file to the storage provider.
   * Returns the secure stored filename and relative path.
   */
  saveFile(
    file: Express.Multer.File,
    folder: string
  ): Promise<{ storedFileName: string; storagePath: string }>;

  /**
   * Deletes a file from the storage provider.
   */
  deleteFile(storagePath: string): Promise<void>;

  /**
   * Retrieves a file as a readable stream.
   */
  getFileStream(storagePath: string): Promise<NodeJS.ReadableStream>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor(uploadDir: string = env.UPLOAD_DIR) {
    this.uploadDir = path.resolve(process.cwd(), uploadDir);
    this.ensureDirectoryExists(this.uploadDir);
  }

  /**
   * Helper to ensure folders exist.
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Saves a file by writing its buffer to the disk.
   */
  async saveFile(
    file: Express.Multer.File,
    folder: string
  ): Promise<{ storedFileName: string; storagePath: string }> {
    // Enforce folder checks & traversal guards
    const destinationDir = path.resolve(this.uploadDir, folder);
    if (!destinationDir.startsWith(this.uploadDir)) {
      throw new Error('Directory traversal attempt blocked.');
    }
    this.ensureDirectoryExists(destinationDir);

    // Generate secure filename
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const storedFileName = `${uniqueSuffix}${ext}`;
    const fullPath = path.join(destinationDir, storedFileName);

    // Write file buffer to target path
    await fs.promises.writeFile(fullPath, file.buffer);

    // Calculate relative path for database storage (OS-independent format)
    const storagePath = path.join(folder, storedFileName).replace(/\\/g, '/');
    logger.info(`File successfully saved to local disk: ${storagePath}`);

    return { storedFileName, storagePath };
  }

  /**
   * Removes a file from local disk.
   */
  async deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.resolve(this.uploadDir, storagePath);
    if (!fullPath.startsWith(this.uploadDir)) {
      throw new Error('Directory traversal attempt blocked.');
    }

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      logger.info(`File deleted from local disk: ${storagePath}`);
    } else {
      logger.warn(`File delete requested but file not found on disk: ${storagePath}`);
    }
  }

  /**
   * Returns a file readable stream.
   */
  async getFileStream(storagePath: string): Promise<NodeJS.ReadableStream> {
    const fullPath = path.resolve(this.uploadDir, storagePath);
    if (!fullPath.startsWith(this.uploadDir)) {
      throw new Error('Directory traversal attempt blocked.');
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error('Requested document does not exist.');
    }

    return fs.createReadStream(fullPath);
  }
}

// In the future, we can change the provider here (e.g. S3StorageProvider) based on configs.
export const StorageService: StorageProvider = new LocalStorageProvider();
export default StorageService;
