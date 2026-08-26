from django.shortcuts import render


def dashboard(request):
    return render(request, 'dashboard/dashboard.html')


def appointments(request):
    return render(request, 'dashboard/appointments.html')


def appointment(request, tracking_code):
    return render(request, 'dashboard/appointment.html', {'tracking_code': tracking_code})


def finalize_information(request, tracking_code):
    return render(request, 'dashboard/finalize-information.html', {'tracking_code': tracking_code})


def gallery(request):
    return render(request, 'dashboard/gallery.html')


def notifications(request):
    return render(request, 'dashboard/notifications.html')


def select_doctors(request, service):
    return render(request, 'dashboard/select-doctors.html', {'service': service})
