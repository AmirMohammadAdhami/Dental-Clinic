"""Shared API-level constants."""

# Deposit (بیعانه) amount shown on the select-doctors page and stored on the
# appointment when a slot is booked online.
DEPOSIT_PRICE = 200000  # Toman

# Appointment statuses that hold/occupy an AppointmentSlot.
BLOCKING_APPOINTMENT_STATUSES = ['PENDING', 'RESERVED']
