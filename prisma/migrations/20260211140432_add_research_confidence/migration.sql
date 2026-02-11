-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Research" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reviewId" INTEGER,
    "artistName" TEXT NOT NULL,
    "albumName" TEXT NOT NULL,
    "genre" TEXT,
    "artistBio" TEXT,
    "albumSummary" TEXT,
    "userOpinions" TEXT,
    "keyThemes" TEXT,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "confidence" TEXT NOT NULL DEFAULT 'low',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Research_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Research" ("albumName", "albumSummary", "artistBio", "artistName", "createdAt", "genre", "id", "keyThemes", "reviewId", "sources", "userOpinions") SELECT "albumName", "albumSummary", "artistBio", "artistName", "createdAt", "genre", "id", "keyThemes", "reviewId", "sources", "userOpinions" FROM "Research";
DROP TABLE "Research";
ALTER TABLE "new_Research" RENAME TO "Research";
CREATE UNIQUE INDEX "Research_reviewId_key" ON "Research"("reviewId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
