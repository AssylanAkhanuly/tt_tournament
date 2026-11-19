from django.contrib import admin

from .models import (
    MedicalRecord, NationalTeamMember, PlanItem, ReportAction, SportRecord, TrainingEvent, TrainingPlan, TravelReport,
)

for model in (NationalTeamMember, MedicalRecord, SportRecord, TrainingEvent, TrainingPlan, PlanItem, TravelReport, ReportAction):
    admin.site.register(model)
