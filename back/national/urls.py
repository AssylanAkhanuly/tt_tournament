from django.urls import path

from . import views

urlpatterns = [
    path("members/", views.MembersView.as_view()),
    path("members/candidates/", views.CandidatesView.as_view()),
    path("members/<uuid:pk>/", views.MemberView.as_view()),
    path("members/<uuid:pk>/medical/", views.MedicalView.as_view()),
    path("members/<uuid:pk>/plans/", views.PlansView.as_view()),
    path("medical/<uuid:pk>/", views.MedicalRecordView.as_view()),
    path("plans/<uuid:pk>/", views.PlanView.as_view()),
    path("plans/<uuid:pk>/items/", views.PlanItemsView.as_view()),
    path("plan-items/<uuid:pk>/", views.PlanItemView.as_view()),
]
