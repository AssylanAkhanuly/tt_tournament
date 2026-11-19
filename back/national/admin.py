from django.contrib import admin

from .models import MedicalRecord, NationalTeamMember, PlanItem, TrainingPlan

admin.site.register(NationalTeamMember)
admin.site.register(MedicalRecord)
admin.site.register(TrainingPlan)
admin.site.register(PlanItem)
