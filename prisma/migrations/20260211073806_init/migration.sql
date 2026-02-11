-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "artistName" TEXT,
    "albumName" TEXT,
    "genre" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reviewId" INTEGER NOT NULL,
    "specificityScore" INTEGER NOT NULL,
    "musicalElementScore" INTEGER NOT NULL,
    "clicheScore" INTEGER NOT NULL,
    "structureScore" INTEGER NOT NULL,
    "personalStoryScore" INTEGER NOT NULL,
    "overallScore" REAL NOT NULL,
    "specificityComment" TEXT NOT NULL,
    "musicalElementComment" TEXT NOT NULL,
    "clicheComment" TEXT NOT NULL,
    "structureComment" TEXT NOT NULL,
    "personalStoryComment" TEXT NOT NULL,
    "overallComment" TEXT NOT NULL,
    "detectedCliches" TEXT NOT NULL DEFAULT '[]',
    "suggestions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Research" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Research_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cliche" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "expression" TEXT NOT NULL,
    "category" TEXT,
    "alternative" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_reviewId_key" ON "Feedback"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Research_reviewId_key" ON "Research"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliche_expression_key" ON "Cliche"("expression");
