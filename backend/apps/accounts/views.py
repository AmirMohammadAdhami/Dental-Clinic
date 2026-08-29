from django.http import HttpResponse
from django.shortcuts import render
from django.contrib import messages
from django.shortcuts import redirect
from .services import otp_services, send_otp
from .models import OTPCode
from datetime import timedelta
from django.utils import timezone


def login(request):
    if request.method == 'POST':
        phone_number = request.POST.get('phone_number')

        if not phone_number:
            messages.error(request, 'Phone number is required')
            return redirect('accounts:login')

        if not phone_number.isdigit():
            messages.error(request, 'Invalid phone number')
            return redirect('accounts:login')

        if phone_number.startswith('0'):
            phone_number = phone_number[1:]

        if len(phone_number) != 10 or not phone_number.startswith('9'):
            messages.error(request, 'Invalid phone number')
            return redirect('accounts:login')

        unique_otp = otp_services.generate_otp(phone_number)

        send_otp.send_verification_code(
            unique_otp,
            phone_number
        )

        hashed_otp = otp_services.hash_otp(unique_otp)

        OTPCode.objects.create(
            phone_number=phone_number,
            code=hashed_otp,
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        request.session['phone_number'] = phone_number

        return render(
            request,
            'auth/otp.html',
            context={'phone_number': phone_number}
        )

    return render(request, 'auth/login.html')


def otp(request):
    if request.method == 'POST':

        phone_number = request.session.get('phone_number')

        if not phone_number:
            messages.error(
                request,
                'You need to enter a phone number'
            )
            return redirect('accounts:login')

        unique_otp = OTPCode.objects.filter(
            phone_number=phone_number
        ).order_by('-created_at').first()

        if not unique_otp:
            messages.error(request, 'OTP not found')
            return redirect('accounts:login')

        if not unique_otp.is_valid():
            messages.error(
                request,
                'Invalid or expired OTP'
            )
            return redirect('accounts:login')

        post_otp_code = ''.join([
            request.POST.get('number-1', ''),
            request.POST.get('number-2', ''),
            request.POST.get('number-3', ''),
            request.POST.get('number-4', ''),
            request.POST.get('number-5', ''),
        ])

        if otp_services.verify_otp(
                unique_otp.code,
                post_otp_code
        ):
            unique_otp.is_used = True
            unique_otp.save(update_fields=['is_used'])

            request.session['otp_verified'] = True

            return redirect('accounts:login-info')

        unique_otp.attempts += 1
        unique_otp.save(update_fields=['attempts'])

        messages.error(request, 'Invalid OTP')
        return redirect('accounts:otp')

    return render(request, 'auth/otp.html')


def login_info(request):
    return render(request, 'auth/login-info.html')
