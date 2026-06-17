/*
  Warnings:

  - A unique constraint covering the columns `[type,externalId]` on the table `channels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `channels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "channels_type_externalId_key" ON "channels"("type", "externalId");
