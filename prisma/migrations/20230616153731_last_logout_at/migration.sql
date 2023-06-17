-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogoutAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO "new_User" ("additionalInfo", "avatar", "createdAt", "email", "id", "lastLoginAt", "onlineStatus", "password", "permitted", "role", "sessionToken", "username") SELECT "additionalInfo", "avatar", "createdAt", "email", "id", "lastLoginAt", "onlineStatus", "password", "permitted", "role", "sessionToken", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
