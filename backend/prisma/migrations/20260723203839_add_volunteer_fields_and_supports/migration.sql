-- AlterTable
ALTER TABLE "volunteers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "birth_city" TEXT,
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "eps" TEXT,
ADD COLUMN     "expectations" TEXT,
ADD COLUMN     "last_updated_at" TIMESTAMP(3),
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "segment" TEXT,
ADD COLUMN     "shirt_size" TEXT,
ADD COLUMN     "support_needs" TEXT;

-- CreateTable
CREATE TABLE "volunteer_supports" (
    "id" TEXT NOT NULL,
    "volunteer_doc" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION,
    "type" TEXT,
    "meal_value" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_supports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "volunteer_supports_volunteer_doc_idx" ON "volunteer_supports"("volunteer_doc");

-- CreateIndex
CREATE INDEX "volunteer_supports_date_idx" ON "volunteer_supports"("date");

-- AddForeignKey
ALTER TABLE "volunteer_supports" ADD CONSTRAINT "volunteer_supports_volunteer_doc_fkey" FOREIGN KEY ("volunteer_doc") REFERENCES "volunteers"("doc_number") ON DELETE CASCADE ON UPDATE CASCADE;
