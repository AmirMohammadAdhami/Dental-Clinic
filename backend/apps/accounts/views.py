from django.shortcuts import render
from django.contrib import messages
from django.shortcuts import redirect
from .services import otp_services
from .tasks import send_otp_task
from .models import OTPCode
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model, login, logout
from ...security.throttle import (
    check_throttle, LoginThrottle, OtpThrottle, ResendOtpThrottle,
)

User = get_user_model()


def login_user(request):
    if request.user.is_authenticated:
        messages.error(request, 'You are already logged in.')
        return redirect('core:home')

    if request.method == 'POST':
        # Throttle: limit login attempts per IP to prevent SMS abuse
        check_throttle(request, LoginThrottle())

        phone_number = request.POST.get('phone_number')

        if not phone_number:
            messages.error(request, 'Phone number is required')
            return redirect('accounts:login')

        if not phone_number.isdigit():
            messages.error(request, 'Invalid phone number')
            return redirect('accounts:login')

        if not phone_number.startswith('0'):
            phone_number = '0' + phone_number

        if len(phone_number) != 11 or not phone_number.startswith('09'):
            messages.error(request, 'Invalid phone number')
            return redirect('accounts:login')

        unique_otp = otp_services.generate_otp()

        # Dispatch SMS sending to Celery — the view returns immediately.
        send_otp_task.delay(unique_otp, phone_number)

        hashed_otp = otp_services.hash_otp(unique_otp)

        OTPCode.objects.create(
            phone_number=phone_number,
            code=hashed_otp,
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        request.session['phone_number'] = phone_number
        messages.success(request, 'Your OTP code has been sent.')

        return redirect('accounts:otp')

    return render(request, 'auth/login.html')

def otp(request):
    if request.user.is_authenticated:
        messages.error(request, 'You are already logged in.')
        return redirect('core:home')

    phone_number = request.session.get('phone_number')

    if not phone_number:
        messages.error(
            request,
            'You need to enter a phone number'
        )
        return redirect('accounts:login')

    if request.method == 'POST':
        # Throttle: limit OTP verification attempts per phone/IP
        check_throttle(request, OtpThrottle())
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
                post_otp_code,
                unique_otp.code
        ):
            unique_otp.is_used = True
            unique_otp.save(update_fields=['is_used'])


            user = User.objects.filter(phone=phone_number).first()
            if not user:
                request.session['otp_verified'] = True
                return redirect('accounts:login-info')

            login(request, user)

            request.session.pop('phone_number', None)

            messages.success(request, 'You are now logged in.')

            if hasattr(user, 'doctor'):
                return redirect('doctors:doctor_dashboard_analytics')
            return redirect('dashboard:dashboard')

        unique_otp.attempts += 1
        unique_otp.save(update_fields=['attempts'])

        messages.error(request, 'Invalid OTP')
        return redirect('accounts:otp')

    return render(request, 'auth/otp.html', context={'phone_number': phone_number})


def resend_otp(request):
    if request.user.is_authenticated:
        messages.error(request, 'You are already logged in.')
        return redirect('core:home')

    if request.method != 'POST':
        return redirect('accounts:login')

    phone_number = request.session.get('phone_number')

    if not phone_number:
        messages.error(
            request,
            'You need to enter a phone number'
        )
        return redirect('accounts:login')

    # Throttle: limit OTP resend requests per phone/IP
    check_throttle(request, ResendOtpThrottle())

    last_otp = OTPCode.objects.filter(
        phone_number=phone_number
    ).order_by('-created_at').first()


    if last_otp:
        resend_available_at = (
            last_otp.created_at + timedelta(minutes=2)
        )

        if timezone.now() < resend_available_at:
            messages.error(
                request,
                'Please wait before requesting another OTP.'
            )
            return redirect('accounts:otp')


    OTPCode.objects.filter(
        phone_number=phone_number,
        is_used=False
    ).update(is_used=True)


    unique_otp = otp_services.generate_otp()

    # Dispatch SMS sending to Celery — the view returns immediately.
    send_otp_task.delay(unique_otp, phone_number)

    hashed_otp = otp_services.hash_otp(unique_otp)

    OTPCode.objects.create(
        phone_number=phone_number,
        code=hashed_otp,
        expires_at=timezone.now() + timedelta(minutes=10)
    )

    messages.success(
        request,
        'A new OTP has been sent.'
    )

    return redirect('accounts:otp')


def login_info(request):
    if request.user.is_authenticated:
        messages.error(request, 'You are already logged in.')
        return redirect('core:home')

    if not request.session.get('otp_verified'):
        messages.error(request, 'OTP not verified')
        return redirect('accounts:login')

    if request.method == 'POST':
        phone_number = request.session.get('phone_number')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        national_code = request.POST.get('national_code', '')
        if not phone_number:
            messages.error(request, 'Phone number is required')
            return redirect('accounts:login')
        if not first_name or not last_name or not national_code:
            messages.error(request, 'Please enter all fields')
            return redirect('accounts:login-info')

        user = User.objects.create_user(
            phone=phone_number,
            national_code=national_code,
            first_name=first_name,
            last_name=last_name,
        )

        login(request, user)

        request.session.pop('otp_verified', None)
        request.session.pop('phone_number', None)
        messages.success(request, 'You are now Signed up.')
        return redirect('dashboard:dashboard')

    return render(request, 'auth/login-info.html')


def logout_user(request):
    if request.user.is_authenticated:
        messages.success(request, 'You are logged out.')
        logout(request)
        return redirect('core:home')

    messages.error(request, 'You are not logged in.')
    return redirect('accounts:login')
