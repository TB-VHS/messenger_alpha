/*
  Warnings:

  - Added the required column `datetimeClient` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `datetimeServer` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "avatar" TEXT NOT NULL DEFAULT 'default.png',
    "permitted" BOOLEAN NOT NULL DEFAULT true,
    "onlineStatus" TEXT NOT NULL DEFAULT 'offline',
    "sessionToken" TEXT NOT NULL DEFAULT '',
    "additionalInfo" TEXT
);
INSERT INTO "new_User" ("avatar", "createdAt", "email", "id", "lastLoginAt", "onlineStatus", "password", "permitted", "role", "username") SELECT "avatar", "createdAt", "email", "id", "lastLoginAt", "onlineStatus", "password", "permitted", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datetimeClient" DATETIME NOT NULL,
    "datetimeServer" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("authorId", "content", "id") SELECT "authorId", "content", "id" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
