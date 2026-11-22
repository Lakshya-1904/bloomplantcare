CREATE TABLE "watering_schedules" (
	"browser_id" text,
	"plant_id" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"interval" integer NOT NULL,
	CONSTRAINT "watering_schedules_pkey" PRIMARY KEY("browser_id","plant_id")
);
