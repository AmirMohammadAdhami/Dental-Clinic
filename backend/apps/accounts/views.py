from django.http import HttpResponse
from django.shortcuts import render
from django.contrib import messages
from django.shortcuts import redirect
from .services import otp_services, send_otp
from .models import OTPCode


def login(request):
    phone_number = request.GET.get('phone_number')

    if phone_number:

        if not phone_number.isdigit():
            messages.error(request, 'Invalid phone number')
            return redirect('accounts:login')

        if phone_number.startswith('0'):
            phone_number = phone_number[1:]

        if len(phone_number) != 10:
            messages.error(request, 'Invalid phone number')
            return redirect('accounts:login')

        unique_otp = otp_services.generate_otp(phone_number)

        send_otp.send_verification_code(unique_otp, phone_number)

        unique_otp = otp_services.hash_otp(unique_otp)

        otp_object = OTPCode.objects.create(phone_number=phone_number, otp=unique_otp)

        request.session['phone_number'] = phone_number

        return render(
            request,
            'auth/otp.html',
            context={'phone_number': phone_number}
        )

    return render(request, 'auth/login.html')


def otp(request):
    phone_number = request.GET.get('phone_number')
    if not phone_number:
        messages.error(request, 'You need to enter a phone number')
        return redirect('accounts:login')

    otp_code = request.POST.get('number-1') + request.POST.get('number-2') + request.POST.get(
        'number-3') + request.POST.get('number-4') + request.POST.get('number-5')

    return render(request, 'auth/otp.html')


def login_info(request):
    return render(request, 'auth/login-info.html')
