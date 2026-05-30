from django.urls import path
from .views import (
    ClubListCreateView,
    ClubDetailView,
    ClubTableListCreateView,
    ClubTableDetailView,
    ClubAdminListCreateView,
    ClubAdminRemoveView,
    MyClubsView,
    UploadClubPhotoView,
)

urlpatterns = [
    path('',                                  ClubListCreateView.as_view(),      name='club-list-create'),
    path('my/',                               MyClubsView.as_view(),             name='club-my'),
    path('<uuid:pk>/',                        ClubDetailView.as_view(),          name='club-detail'),
    path('<uuid:pk>/photo/',                  UploadClubPhotoView.as_view(),     name='club-photo'),
    path('<uuid:pk>/tables/',                 ClubTableListCreateView.as_view(), name='club-tables'),
    path('<uuid:pk>/tables/<int:table_id>/',  ClubTableDetailView.as_view(),    name='club-table-detail'),
    path('<uuid:pk>/admins/',                 ClubAdminListCreateView.as_view(), name='club-admins'),
    path('<uuid:pk>/admins/<int:admin_id>/',  ClubAdminRemoveView.as_view(),    name='club-admin-remove'),
]
