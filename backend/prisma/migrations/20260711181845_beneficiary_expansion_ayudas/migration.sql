-- AlterTable
ALTER TABLE "beneficiaries" ADD COLUMN     "birth_city" TEXT,
ADD COLUMN     "caregiver_name" TEXT,
ADD COLUMN     "caregiver_phone" TEXT,
ADD COLUMN     "caregiver_relationship" TEXT,
ADD COLUMN     "celular" TEXT,
ADD COLUMN     "clinica_hospital" TEXT,
ADD COLUMN     "como_se_entero" TEXT,
ADD COLUMN     "condicion" TEXT,
ADD COLUMN     "deceased_date" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "diagnostico" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "eps" TEXT,
ADD COLUMN     "etnia" TEXT,
ADD COLUMN     "father_doc_number" TEXT,
ADD COLUMN     "father_education" TEXT,
ADD COLUMN     "father_lives_with_child" BOOLEAN,
ADD COLUMN     "father_name" TEXT,
ADD COLUMN     "father_occupation" TEXT,
ADD COLUMN     "father_phone" TEXT,
ADD COLUMN     "father_profession" TEXT,
ADD COLUMN     "father_responds_econ" BOOLEAN,
ADD COLUMN     "gov_subsidy_type" TEXT,
ADD COLUMN     "has_siblings" BOOLEAN,
ADD COLUMN     "housing_strata" INTEGER,
ADD COLUMN     "housing_type" TEXT,
ADD COLUMN     "income_source" TEXT,
ADD COLUMN     "is_displaced" BOOLEAN DEFAULT false,
ADD COLUMN     "last_updated_at" TIMESTAMP(3),
ADD COLUMN     "mother_doc_number" TEXT,
ADD COLUMN     "mother_education" TEXT,
ADD COLUMN     "mother_lives_with_child" BOOLEAN,
ADD COLUMN     "mother_name" TEXT,
ADD COLUMN     "mother_occupation" TEXT,
ADD COLUMN     "mother_phone" TEXT,
ADD COLUMN     "mother_profession" TEXT,
ADD COLUMN     "mother_responds_econ" BOOLEAN,
ADD COLUMN     "nationality" TEXT DEFAULT 'Colombiana',
ADD COLUMN     "num_people_in_home" INTEGER,
ADD COLUMN     "num_siblings" INTEGER,
ADD COLUMN     "other_diagnosis" TEXT,
ADD COLUMN     "public_services" JSONB,
ADD COLUMN     "public_transport_nearby" BOOLEAN,
ADD COLUMN     "receives_gov_subsidy" BOOLEAN,
ADD COLUMN     "regimen" TEXT,
ADD COLUMN     "siblings_data" JSONB,
ADD COLUMN     "sisben_group" TEXT,
ADD COLUMN     "tratado_en" TEXT,
ADD COLUMN     "zone" TEXT,
ALTER COLUMN "birth_date" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ayudas" (
    "id" TEXT NOT NULL,
    "beneficiary_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo_solicitud" TEXT NOT NULL,
    "personas_beneficiadas" INTEGER NOT NULL DEFAULT 1,
    "justificacion" TEXT,
    "valor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ayudas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ayudas_beneficiary_id_idx" ON "ayudas"("beneficiary_id");

-- CreateIndex
CREATE INDEX "ayudas_fecha_idx" ON "ayudas"("fecha");

-- AddForeignKey
ALTER TABLE "ayudas" ADD CONSTRAINT "ayudas_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
