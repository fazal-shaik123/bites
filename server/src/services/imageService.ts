import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { db } from '../db/index.js';
import { config } from '../config.js';

export async function sliceAndCreateTiles(
  puzzleId: number,
  sourceImagePath: string,
  gridSize: number,
  tileNotes?: (string | null | undefined)[]
): Promise<void> {
  const puzzleFolder = path.join(config.puzzleUploadsDir, `puzzle_${puzzleId}`);
  if (!fs.existsSync(puzzleFolder)) {
    fs.mkdirSync(puzzleFolder, { recursive: true });
  }

  // Target standard square dimension for clean slicing
  const standardSize = 900;
  const tileDimension = Math.floor(standardSize / gridSize);

  // Resize original image to standard square
  const normalizedBuffer = await sharp(sourceImagePath)
    .resize(standardSize, standardSize, {
      fit: 'cover',
      position: 'center'
    })
    .toBuffer();

  // Crop all tiles first asynchronously
  const tileRecords: { r: number; c: number; filePath: string; note: string | null }[] = [];
  let noteIndex = 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const left = c * tileDimension;
      const top = r * tileDimension;
      const tileFileName = `tile_${r}_${c}.webp`;
      const tileFilePath = path.join(puzzleFolder, tileFileName);

      await sharp(normalizedBuffer)
        .extract({
          left,
          top,
          width: tileDimension,
          height: tileDimension
        })
        .webp({ quality: 85 })
        .toFile(tileFilePath);

      const note = tileNotes && tileNotes[noteIndex] ? String(tileNotes[noteIndex]) : null;
      tileRecords.push({ r, c, filePath: tileFilePath, note });
      noteIndex++;
    }
  }

  // Insert database records in a synchronous transaction
  const insertTile = db.prepare(`
    INSERT INTO tiles (puzzle_id, row_idx, col_idx, tile_image_path, hidden_note, is_unlocked)
    VALUES (?, ?, ?, ?, ?, 0)
  `);

  const insertAll = db.transaction((records: typeof tileRecords) => {
    for (const rec of records) {
      insertTile.run(puzzleId, rec.r, rec.c, rec.filePath, rec.note);
    }
  });

  insertAll(tileRecords);
}
