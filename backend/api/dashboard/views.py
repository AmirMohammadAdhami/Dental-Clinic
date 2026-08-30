from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveAPIView
from .serializers import UserDashboardSerializer


class UserDashboardAPIView(RetrieveAPIView):
    serializer_class = UserDashboardSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

