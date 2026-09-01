"""Shared API-level constants."""

# Deposit (بیعانه) amount shown on the select-doctors page and stored on the
# appointment when a slot is booked online.
DEPOSIT_PRICE = 200000  # Toman

# Appointment statuses that hold/occupy an AppointmentSlot.
BLOCKING_APPOINTMENT_STATUSES = ['PENDING', 'RESERVED']

# A PENDING reservation is held for this long. The timer starts when the
# patient opens the finalize-information page (each page load refreshes it);
# if the reservation is never confirmed within the window, the slot is
# released automatically.
RESERVATION_TTL_MINUTES = 1

