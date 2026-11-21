from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.MeView.as_view()),
    path("members/", views.MembersView.as_view()),
    path("members/candidates/", views.CandidatesView.as_view()),
    path("members/personal-coaches/", views.PersonalCoachesView.as_view()),
    path("members/<uuid:pk>/", views.MemberView.as_view()),
    path("members/<uuid:pk>/medical/", views.MedicalView.as_view()),
    path("members/<uuid:pk>/sport/", views.SportView.as_view()),
    path("members/<uuid:pk>/plans/", views.PlansView.as_view()),
    path("members/<uuid:pk>/history/", views.HistoryView.as_view()),
    path("medical/<uuid:pk>/", views.MedicalRecordView.as_view()),
    path("sport/<uuid:pk>/", views.SportRecordView.as_view()),
    path("plans/board/", views.PlanBoardView.as_view()),
    path("plans/<uuid:pk>/", views.PlanView.as_view()),
    path("plans/<uuid:pk>/submit/", views.PlanSubmitView.as_view()),
    path("plans/<uuid:pk>/review/", views.PlanReviewView.as_view()),
    path("plans/<uuid:pk>/items/", views.PlanItemsView.as_view()),
    path("plan-items/<uuid:pk>/", views.PlanItemView.as_view()),
    path("events/", views.EventsView.as_view()),
    path("events/<uuid:pk>/", views.EventView.as_view()),
    path("reports/", views.ReportsView.as_view()),
    path("reports/candidates/", views.ReportCandidatesView.as_view()),
    path("reports/<uuid:pk>/", views.ReportView.as_view()),
    path("reports/<uuid:pk>/decide/", views.ReportDecideView.as_view()),
    path("reports/<uuid:pk>/file/", views.ReportFileView.as_view()),
]
